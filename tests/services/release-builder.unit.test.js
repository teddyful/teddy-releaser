/**
 * Release builder unit tests.
 *
 * @author jillurquddus
 * @copyright Copyright (C) 2025 Jillur Quddus
 * @license GPL-3.0
 * @since 0.0.1
 */

import { EventEmitter } from 'events';
import fs from 'fs';
import path from 'path';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import {
    createFakeTeddyRepo,
    createReleaseConfig,
    createTestDir,
    RELEASE_VERSION,
    writeFile,
    writeJson
} from '../helpers/release-fixtures.js';

const TEST_ROOT = path.resolve('working', 'tests', 'release-builder.unit');
const TEDDY_REPO = path.join(TEST_ROOT, 'teddy');
const RELEASER_ROOT = path.join(TEST_ROOT, 'releaser-root');

const mockState = vi.hoisted(() => {
    return {
        branchName: 'release-0.0.15',
        gitStatusCode: 0,
        gitStatusStdout: '',
        gitStatusStderr: '',
        npmResults: {
            test: {
                code: 0,
                stdout: '',
                stderr: ''
            },
            'test:upgrade': {
                code: 0,
                stdout: '',
                stderr: ''
            }
        },
        releaserRoot: '',
        spawnCalls: []
    };
});

vi.mock('current-git-branch', () => {
    return {
        default: vi.fn(() => mockState.branchName)
    };
});

vi.mock('../../src/middleware/logger.js', () => {
    return {
        default: {
            debug: vi.fn(),
            error: vi.fn(),
            info: vi.fn()
        }
    };
});

vi.mock('url', async importOriginal => {
    const actual = await importOriginal();
    return {
        ...actual,
        fileURLToPath: vi.fn(() =>
            `${mockState.releaserRoot}/src/services/release-builder.js`)
    };
});

vi.mock('zip-a-folder', async () => {
    const fsModule = await import('fs');
    const pathModule = await import('path');
    const writeArchive = async (sourcePath, targetPath) => {
        fsModule.mkdirSync(pathModule.dirname(targetPath), { recursive: true });
        fsModule.writeFileSync(targetPath, `archive:${sourcePath}`);
    };
    return {
        tar: vi.fn(writeArchive),
        zip: vi.fn(writeArchive)
    };
});

vi.mock('child_process', async importOriginal => {
    const actual = await importOriginal();
    return {
        ...actual,
        spawn: vi.fn((command, args, options) => {
            mockState.spawnCalls.push({ command, args, options });
            const childProcess = new EventEmitter();
            childProcess.stdout = new EventEmitter();
            childProcess.stderr = new EventEmitter();
            queueMicrotask(() => {
                if ( command === 'git' ) {
                    if ( mockState.gitStatusStdout ) {
                        childProcess.stdout.emit('data', mockState.gitStatusStdout);
                    }
                    if ( mockState.gitStatusStderr ) {
                        childProcess.stderr.emit('data', mockState.gitStatusStderr);
                    }
                    childProcess.emit('close', mockState.gitStatusCode);
                    return;
                }
                const scriptName = args?.[1];
                const result = mockState.npmResults[scriptName] ?? {
                    code: 0,
                    stdout: '',
                    stderr: ''
                };
                if ( result.stdout ) {
                    childProcess.stdout.emit('data', result.stdout);
                }
                if ( result.stderr ) {
                    childProcess.stderr.emit('data', result.stderr);
                }
                childProcess.emit('close', result.code);
            });
            return childProcess;
        })
    };
});

async function importReleaseBuilder() {
    vi.resetModules();
    const { default: ReleaseBuilder } = await import(
        '../../src/services/release-builder.js'
    );
    return ReleaseBuilder;
}

function resetMockState() {
    mockState.branchName = `release-${RELEASE_VERSION}`;
    mockState.gitStatusCode = 0;
    mockState.gitStatusStdout = '';
    mockState.gitStatusStderr = '';
    mockState.npmResults = {
        test: {
            code: 0,
            stdout: '',
            stderr: ''
        },
        'test:upgrade': {
            code: 0,
            stdout: '',
            stderr: ''
        }
    };
    mockState.releaserRoot = RELEASER_ROOT;
    mockState.spawnCalls = [];
}

async function runBuild(repoPath = TEDDY_REPO) {
    const ReleaseBuilder = await importReleaseBuilder();
    const releaseBuilder = new ReleaseBuilder(repoPath);
    await releaseBuilder.build();
    return releaseBuilder;
}

describe('ReleaseBuilder validation failures', () => {

    beforeEach(() => {
        resetMockState();
        createTestDir('release-builder.unit');
        fs.mkdirSync(RELEASER_ROOT, { recursive: true });
    });

    afterEach(() => {
        vi.clearAllMocks();
        fs.rmSync(TEST_ROOT, { recursive: true, force: true });
    });

    test('rejects a path that is not a Teddy repository', async () => {
        await expect(runBuild(path.join(TEST_ROOT, 'missing')))
            .rejects
            .toThrow('does not point to a valid instance of Teddy');
    });

    test('rejects a Teddy repository without config/release.json', async () => {
        writeJson(path.join(TEDDY_REPO, 'package.json'), {
            name: 'teddy',
            version: RELEASE_VERSION
        });
        await expect(runBuild())
            .rejects
            .toThrow('does not point to a valid instance of Teddy');
    });

    test('rejects a configured resource that does not exist', async () => {
        createFakeTeddyRepo(TEDDY_REPO);
        fs.rmSync(path.join(TEDDY_REPO, 'README.md'));
        await expect(runBuild())
            .rejects
            .toThrow("resource is missing: 'README.md'");
    });

    test('rejects release resources that resolve outside the Teddy repo',
        async () => {
            createFakeTeddyRepo(TEDDY_REPO, {
                releaseConfig: createReleaseConfig({
                    system: {
                        resources: {
                            directories: ['../outside'],
                            files: []
                        }
                    }
                })
            });
            writeFile(path.join(TEST_ROOT, 'outside', 'secret.txt'), 'secret');
            await expect(runBuild())
                .rejects
                .toThrow('resolves outside the expected base directory');
        });

    test('rejects invalid package.json semantic versions', async () => {
        createFakeTeddyRepo(TEDDY_REPO, {
            version: 'v0.0.15'
        });
        await expect(runBuild())
            .rejects
            .toThrow('must be a clean semantic version');
    });

    test('rejects non-release branch names', async () => {
        createFakeTeddyRepo(TEDDY_REPO);
        mockState.branchName = `feature/release-${RELEASE_VERSION}`;
        await expect(runBuild())
            .rejects
            .toThrow('Releases can only be built from branches named');
    });

    test('rejects release branches with mismatched versions', async () => {
        createFakeTeddyRepo(TEDDY_REPO);
        mockState.branchName = 'release-0.0.16';
        await expect(runBuild())
            .rejects
            .toThrow('does not match the version number');
    });

    test('rejects dirty working trees', async () => {
        createFakeTeddyRepo(TEDDY_REPO);
        mockState.gitStatusStdout = ' M package.json\n?? scratch.txt\n';
        await expect(runBuild())
            .rejects
            .toThrow('The Teddy working tree is not clean');
    });

    test('rejects git status command failures', async () => {
        createFakeTeddyRepo(TEDDY_REPO);
        mockState.gitStatusCode = 128;
        mockState.gitStatusStderr = 'fatal: not a git repository';
        await expect(runBuild())
            .rejects
            .toThrow('Git status failed with exit code 128');
    });

});

describe('ReleaseBuilder test command behavior', () => {

    beforeEach(() => {
        resetMockState();
        createTestDir('release-builder.unit');
        fs.mkdirSync(RELEASER_ROOT, { recursive: true });
        createFakeTeddyRepo(TEDDY_REPO);
    });

    afterEach(() => {
        vi.clearAllMocks();
        fs.rmSync(TEST_ROOT, { recursive: true, force: true });
    });

    test('fails when the normal Teddy test suite fails', async () => {
        mockState.npmResults.test = {
            code: 1,
            stdout: '',
            stderr: 'normal tests failed'
        };
        await expect(runBuild())
            .rejects
            .toThrow('Teddy test suite failed');
        const npmCalls = mockState.spawnCalls
            .filter(call => call.command === 'npm');
        expect(npmCalls).toHaveLength(1);
        expect(npmCalls[0].args).toEqual(['run', 'test']);
    });

    test('fails when the Teddy upgrade test suite fails', async () => {
        mockState.npmResults['test:upgrade'] = {
            code: 1,
            stdout: '',
            stderr: 'upgrade tests failed'
        };
        await expect(runBuild())
            .rejects
            .toThrow('Teddy upgrade test suite failed');
        const npmCalls = mockState.spawnCalls
            .filter(call => call.command === 'npm');
        expect(npmCalls.map(call => call.args)).toEqual([
            ['run', 'test'],
            ['run', 'test:upgrade']
        ]);
    });

    test('runs both Teddy test suites with offline non-interactive options',
        async () => {
            const releaseBuilder = await runBuild();
            expect(releaseBuilder.statusCode).toBe(0);
            const npmCalls = mockState.spawnCalls
                .filter(call => call.command === 'npm');
            expect(npmCalls.map(call => call.args)).toEqual([
                ['run', 'test'],
                ['run', 'test:upgrade']
            ]);
            for ( const call of npmCalls ) {
                expect(call.options.cwd).toBe(TEDDY_REPO);
                expect(call.options.shell).toBe(false);
                expect(call.options.env.CI).toBe('true');
                expect(call.options.env.NO_COLOR).toBe('1');
                expect(call.options.env.npm_config_progress).toBe('false');
            }
        });

});

describe('ReleaseBuilder release artifacts', () => {

    beforeEach(() => {
        resetMockState();
        createTestDir('release-builder.unit');
        fs.mkdirSync(RELEASER_ROOT, { recursive: true });
        createFakeTeddyRepo(TEDDY_REPO);
    });

    afterEach(() => {
        vi.clearAllMocks();
        fs.rmSync(TEST_ROOT, { recursive: true, force: true });
    });

    test('creates archives and checksums inside working/tests release root',
        async () => {
            const releaseBuilder = await runBuild();
            const releaseDir = path.join(
                RELEASER_ROOT,
                'working',
                'releases',
                RELEASE_VERSION
            );
            const tarPath = path.join(releaseDir, `teddy-${RELEASE_VERSION}.tgz`);
            const zipPath = path.join(releaseDir, `teddy-${RELEASE_VERSION}.zip`);
            const checksumsPath = path.join(
                releaseDir,
                `teddy-${RELEASE_VERSION}-checksums.txt`
            );
            expect(releaseBuilder.statusCode).toBe(0);
            expect(releaseBuilder.releaseDir).toBe(releaseDir);
            expect(fs.existsSync(tarPath)).toBe(true);
            expect(fs.existsSync(zipPath)).toBe(true);
            expect(fs.existsSync(checksumsPath)).toBe(true);
            expect(fs.readFileSync(checksumsPath, 'utf8')).toContain(
                `teddy-${RELEASE_VERSION}.tgz`
            );
            expect(fs.readFileSync(checksumsPath, 'utf8')).toContain(
                `teddy-${RELEASE_VERSION}.zip`
            );
            expect(releaseDir.startsWith(TEST_ROOT)).toBe(true);
        });

    test('cleans stale release output before rebuilding', async () => {
        const staleFilePath = path.join(
            RELEASER_ROOT,
            'working',
            'releases',
            RELEASE_VERSION,
            'stale.txt'
        );
        writeFile(staleFilePath, 'stale');
        await runBuild();
        expect(fs.existsSync(staleFilePath)).toBe(false);
    });

});
