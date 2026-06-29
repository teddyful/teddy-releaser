/**
 * Release builder integration tests.
 *
 * @author jillurquddus
 * @copyright Copyright (C) 2025 Jillur Quddus
 * @license GPL-3.0
 * @since 0.0.1
 */

import { EventEmitter } from 'events';
import fs from 'fs';
import path from 'path';
import zlib from 'zlib';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

const TEST_ROOT = path.resolve(
    'working', 'tests', 'release-builder.integration');
const TEST_CWD = path.join(TEST_ROOT, 'cwd');
const TEDDY_REPO = path.join(TEST_ROOT, 'teddy');
const RELEASE_VERSION = '0.0.15';

vi.mock('current-git-branch', () => {
    return {
        default: vi.fn(() => `release-${RELEASE_VERSION}`)
    };
});

vi.mock('child_process', async importOriginal => {
    const actual = await importOriginal();
    return {
        ...actual,
        spawn: vi.fn(() => {
            const childProcess = new EventEmitter();

            childProcess.stdout = new EventEmitter();
            childProcess.stderr = new EventEmitter();

            queueMicrotask(() => {
                childProcess.emit('close', 0);
            });

            return childProcess;
        })
    };
});

function writeFile(filePath, content = '') {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, content);
}

function writeJson(filePath, value) {
    writeFile(filePath, JSON.stringify(value, null, 4));
}

function createFakeTeddyRepo() {
    writeJson(path.join(TEDDY_REPO, 'package.json'), {
        name: 'teddy',
        version: RELEASE_VERSION,
        private: true,
        type: 'module',
        scripts: {
            test: 'vitest run',
            'test:upgrade': 'vitest run --config ./system/tests/upgrade/vitest.config.js'
        }
    });

    writeJson(path.join(TEDDY_REPO, 'package-lock.json'), {
        name: 'teddy',
        version: RELEASE_VERSION,
        lockfileVersion: 3,
        packages: {
            '': {
                name: 'teddy',
                version: RELEASE_VERSION
            }
        }
    });

    writeJson(path.join(TEDDY_REPO, 'config', 'release.json'), {
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
        }
    });

    writeFile(path.join(TEDDY_REPO, '.gitignore'), 'working/\n');
    writeFile(path.join(TEDDY_REPO, 'build.js'), 'console.log("build");\n');
    writeFile(path.join(TEDDY_REPO, 'README.md'), '# Teddy\n');
    writeFile(path.join(TEDDY_REPO, 'upgrade.js'), 'console.log("upgrade");\n');
    writeFile(path.join(TEDDY_REPO, 'docs', 'UPGRADING.md'), '# Upgrading\n');
    writeFile(path.join(TEDDY_REPO, 'system', 'src', 'index.js'), 'export default true;\n');
    writeFile(path.join(TEDDY_REPO, 'themes', 'bear', 'theme.json'), '{}\n');
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

function expectArchiveMatchesUpgraderRootShape(entries) {
    expect(entries).toContain('package.json');
    expect(entries).toContain('upgrade.js');
    expect(entries).toContain('config/release.json');
    expect(entries).toContain('system/src/index.js');
    expect(entries).toContain('themes/bear/theme.json');
    expect(entries).not.toContain('teddy/package.json');
    expect(entries).not.toContain('teddy/upgrade.js');
    expect(entries).not.toContain('teddy/config/release.json');
    for ( const entry of entries ) {
        expect(entry.startsWith('teddy/')).toBe(false);
        expect(entry.startsWith('/')).toBe(false);
        expect(entry.includes('../')).toBe(false);
    }
}

describe('ReleaseBuilder archive root shape', () => {
    
    let originalCwd;
    beforeEach(() => {
        originalCwd = process.cwd();
        fs.rmSync(TEST_ROOT, { recursive: true, force: true });
        fs.mkdirSync(TEST_CWD, { recursive: true });
        createFakeTeddyRepo();
        process.chdir(TEST_CWD);
    });

    afterEach(() => {
        process.chdir(originalCwd);
        vi.clearAllMocks();
        fs.rmSync(TEST_ROOT, { recursive: true, force: true });
    });

    test('created zip and tgz archives match Teddy upgrader extraction expectation',
        async () => {
            const { default: ReleaseBuilder } = await import(
                '../../src/services/release-builder.js'
            );
            const releaseBuilder = new ReleaseBuilder(TEDDY_REPO);
            await releaseBuilder.build();
            expect(releaseBuilder.statusCode).toBe(0);
            const releaseDir = path.join(
                TEST_CWD,
                'working',
                'releases',
                RELEASE_VERSION
            );
            const zipPath = path.join(releaseDir, 
                `teddy-${RELEASE_VERSION}.zip`);
            const tgzPath = path.join(releaseDir, 
                `teddy-${RELEASE_VERSION}.tgz`);
            const checksumsPath = path.join(
                releaseDir,
                `teddy-${RELEASE_VERSION}-checksums.txt`
            );
            expect(fs.existsSync(zipPath)).toBe(true);
            expect(fs.existsSync(tgzPath)).toBe(true);
            expect(fs.existsSync(checksumsPath)).toBe(true);
            expectArchiveMatchesUpgraderRootShape(listZipEntries(zipPath));
            expectArchiveMatchesUpgraderRootShape(listTgzEntries(tgzPath));
        });

});
