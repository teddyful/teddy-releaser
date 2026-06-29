/**
 * Release test fixture helpers.
 *
 * @author jillurquddus
 * @copyright Copyright (C) 2025 Jillur Quddus
 * @license GPL-3.0
 * @since 0.0.1
 */

import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

const RELEASE_VERSION = '0.0.15';
const TEST_ROOT = path.resolve('working', 'tests');

function createTestDir(name) {
    const dirPath = path.join(TEST_ROOT, name);
    fs.rmSync(dirPath, { recursive: true, force: true });
    fs.mkdirSync(dirPath, { recursive: true });
    return dirPath;
}

function writeFile(filePath, content = '') {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, content);
}

function writeJson(filePath, value) {
    writeFile(filePath, JSON.stringify(value, null, 4));
}

function createReleaseConfig(overrides = {}) {
    return {
        dirs: {
            backup: './working/upgrade/backups',
            download: './working/upgrade/downloads'
        },
        releases: {
            latest: 'https://api.github.com/repos/teddyful/teddy/releases/latest',
            notes: 'https://github.com/teddyful/teddy/releases',
            tag: 'https://github.com/teddyful/teddy/releases/tag/v${version}',
            download: {
                baseUrl: 'https://github.com/teddyful/teddy/releases/download/v${version}',
                archive: 'teddy-${version}.zip',
                checksums: 'teddy-${version}-checksums.txt'
            }
        },
        system: {
            resources: {
                directories: [
                    'config',
                    'docs',
                    'system',
                    'themes/bear'
                ],
                files: [
                    '.gitignore',
                    'build.js',
                    'package.json',
                    'package-lock.json',
                    'README.md',
                    'upgrade.js'
                ]
            }
        },
        ...overrides
    };
}

function createFakeTeddyRepo(repoPath, {
    version = RELEASE_VERSION,
    releaseConfig = createReleaseConfig()
} = {}) {
    writeJson(path.join(repoPath, 'package.json'), {
        name: 'teddy',
        version,
        private: true,
        type: 'module',
        scripts: {
            test: 'vitest run',
            'test:upgrade': 'vitest run --config ./system/tests/upgrade/vitest.config.js'
        }
    });
    writeJson(path.join(repoPath, 'package-lock.json'), {
        name: 'teddy',
        version,
        lockfileVersion: 3,
        packages: {
            '': {
                name: 'teddy',
                version
            }
        }
    });
    writeJson(path.join(repoPath, 'config', 'release.json'), releaseConfig);
    writeFile(path.join(repoPath, '.gitignore'), 'working/\n');
    writeFile(path.join(repoPath, 'build.js'), 'console.log("build");\n');
    writeFile(path.join(repoPath, 'README.md'), '# Teddy\n');
    writeFile(path.join(repoPath, 'upgrade.js'), 'console.log("upgrade");\n');
    writeFile(path.join(repoPath, 'docs', 'UPGRADING.md'), '# Upgrading\n');
    writeFile(path.join(repoPath, 'system', 'src', 'index.js'),
        'export default true;\n');
    writeFile(path.join(repoPath, 'themes', 'bear', 'theme.json'), '{}\n');
}

function listZipEntries(zipFilePath) {
    const buffer = fs.readFileSync(zipFilePath);
    const entries = [];
    let offset = 0;
    while ( offset < buffer.length - 4 ) {
        const signature = buffer.readUInt32LE(offset);
        if ( signature !== 0x04034b50 ) {
            offset += 1;
            continue;
        }
        const flags = buffer.readUInt16LE(offset + 6);
        const compressedSize = buffer.readUInt32LE(offset + 18);
        const filenameLength = buffer.readUInt16LE(offset + 26);
        const extraLength = buffer.readUInt16LE(offset + 28);
        const filenameStart = offset + 30;
        const filenameEnd = filenameStart + filenameLength;
        const filename = buffer.toString('utf8', filenameStart, filenameEnd);
        entries.push(filename.replace(/\\/g, '/'));
        if ( flags & 0x08 ) {
            throw new Error('ZIP entries using data descriptors are not ' +
                'supported by this test helper.');
        }
        offset = filenameEnd + extraLength + compressedSize;
    }
    return entries.sort();
}

function listTgzEntries(tgzFilePath) {
    const buffer = zlib.gunzipSync(fs.readFileSync(tgzFilePath));
    const entries = [];
    const blockSize = 512;
    let offset = 0;
    while ( offset + blockSize <= buffer.length ) {
        const header = buffer.subarray(offset, offset + blockSize);
        if ( header.every(byte => byte === 0) ) {
            break;
        }
        const rawName = header
            .subarray(0, 100)
            .toString('utf8')
            .replace(/\0.*$/u, '');
        const rawPrefix = header
            .subarray(345, 500)
            .toString('utf8')
            .replace(/\0.*$/u, '');
        const entryName = rawPrefix ? `${rawPrefix}/${rawName}` : rawName;
        if ( entryName ) {
            entries.push(entryName.replace(/\\/g, '/'));
        }
        const rawSize = header
            .subarray(124, 136)
            .toString('utf8')
            .replace(/\0.*$/u, '')
            .trim();
        const size = rawSize ? Number.parseInt(rawSize, 8) : 0;
        const dataBlockCount = Math.ceil(size / blockSize);
        offset += blockSize + dataBlockCount * blockSize;
    }
    return entries.sort();
}

export {
    createFakeTeddyRepo,
    createReleaseConfig,
    createTestDir,
    listTgzEntries,
    listZipEntries,
    RELEASE_VERSION,
    TEST_ROOT,
    writeFile,
    writeJson
};
