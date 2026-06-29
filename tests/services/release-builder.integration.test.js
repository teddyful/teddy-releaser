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
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import {
    createFakeTeddyRepo,
    createTestDir,
    listTgzEntries,
    listZipEntries,
    RELEASE_VERSION
} from '../helpers/release-fixtures.js';

const TEST_ROOT = path.resolve('working', 'tests', 'release-builder.integration');
const TEDDY_REPO = path.join(TEST_ROOT, 'teddy');
const RELEASER_ROOT = path.join(TEST_ROOT, 'releaser-root');

vi.mock('current-git-branch', () => {
    return {
        default: vi.fn(() => `release-${RELEASE_VERSION}`)
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
        fileURLToPath: vi.fn(() => path.join(
            RELEASER_ROOT, 'src', 'services', 'release-builder.js'))
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

    beforeEach(() => {
        createTestDir('release-builder.integration');
        fs.mkdirSync(RELEASER_ROOT, { recursive: true });
        createFakeTeddyRepo(TEDDY_REPO);
    });

    afterEach(() => {
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
                RELEASER_ROOT,
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
