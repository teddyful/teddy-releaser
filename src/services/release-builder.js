/**
 * Teddy release builder service.
 *
 * @author jillurquddus
 * @copyright Copyright (C) 2025 Jillur Quddus
 * @license GPL-3.0
 * @since 0.0.1
 */

import * as child from 'child_process';
import branchName from "current-git-branch";
import fs from 'fs';
import path from 'path';
import semver from 'semver';
import sha256File from 'sha256-file';
import { deleteSync } from 'del';
import { fileURLToPath } from 'url';
import { tar, zip } from 'zip-a-folder';

import logger from '../middleware/logger.js';
import { 
    createDirectory, 
    loadJsonFile, 
    pathExists, 
    resolvePathInsideBase, 
    writeStringToFile } 
    from '../utils/io-utils.js';

const RELEASER_ROOT = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    '..',
    '..'
);
const RELEASE_BRANCH_REGEX = /^release-(\d+\.\d+\.\d+)$/;
const RELEASE_CONFIG_FILE_PATH = path.join('config', 'release.json');
const RELEASE_PACKAGE_FILE_NAME = 'package.json';
const RELEASE_DIR_PATH = path.join(RELEASER_ROOT, 'working', 'releases');
const TEDDY_LABEL = 'teddy';

class ReleaseBuilder {

    constructor(pathToTeddyRepo) {
        this.statusCode = 1;
        this.pathToTeddyRepo = pathToTeddyRepo;
        this.config = null;
        this.repoIsValid = false;
        this.testsPassed = false;
        this.version = null;
        this.versionMatchesRepoBranchName = false;
        this.releaseDir = null;
        this.archiveBaseName = null;
        this.tarPath = null;
        this.zipPath = null;
    }

    #validateRepo() {
        if ( !pathExists(this.pathToTeddyRepo) || 
            !pathExists(path.join(
                this.pathToTeddyRepo, RELEASE_CONFIG_FILE_PATH)) ) {
            throw new Error(
                `The specified path '${this.pathToTeddyRepo}' does not ` + 
                'point to a valid instance of Teddy');
        }
        const releaseConfigPath = resolvePathInsideBase(
            RELEASE_CONFIG_FILE_PATH,
            this.pathToTeddyRepo,
            'release config file'
        );
        this.config = loadJsonFile(releaseConfigPath);
        for ( const resource of this.config.system.resources.directories.concat(
            this.config.system.resources.files) ) {
            const resourcePath = resolvePathInsideBase(
                resource,
                this.pathToTeddyRepo,
                `release resource '${resource}'`
            );
            if ( !pathExists(resourcePath) ) {
                throw new Error(
                    `The specified path '${this.pathToTeddyRepo}' does not ` + 
                    'point to a valid instance of Teddy, as the following ' + 
                    `resource is missing: '${resource}'.`);
            }
        }
        this.repoIsValid = true;
    }

    #getReleaseVersion() {
        const packageConfig = loadJsonFile(path.join(
            this.pathToTeddyRepo,
            RELEASE_PACKAGE_FILE_NAME
        ));
        const rawVersion = packageConfig.version;
        const version = semver.clean(rawVersion);
        if ( !version ) {
            throw new Error(
                `The version number specified in package.json is invalid: ` +
                `'${rawVersion}'.`
            );
        }
        if ( version !== rawVersion ) {
            throw new Error(
                'The version number specified in package.json must be a ' +
                `clean semantic version. Expected '${version}', received ` +
                `'${rawVersion}'.`
            );
        }
        this.version = version;
    }

    #checkReleaseVersionMatchesRepoBranchName() {
        const repoBranchName = branchName({ cwd: this.pathToTeddyRepo });
        const match = RELEASE_BRANCH_REGEX.exec(repoBranchName ?? '');
        if ( !match ) {
            throw new Error(
                'Releases can only be built from branches named ' +
                `'release-x.y.z'. Current branch: '${repoBranchName}'.`
            );
        }
        const repoBranchVersion = match[1];
        this.versionMatchesRepoBranchName = repoBranchVersion === this.version;
        if ( !this.versionMatchesRepoBranchName ) {
            throw new Error('The version number specified in ' + 
                `package.json (${this.version}) does not match the version ` + 
                'number contained within the name of the checked-out repo ' + 
                `release branch (${repoBranchName}).`);
        }
    }

    #emptyReleaseDirectory() {
        this.releaseDir = path.join(RELEASE_DIR_PATH, this.version);
        if ( pathExists(this.releaseDir) ) {
            deleteSync(this.releaseDir, {
                dot: true, 
                force: true
            });
        }
    }

    async #checkWorkingTreeIsClean() {
        const result = await new Promise((resolve, reject) => {
            const childProcess = child.spawn(
                'git',
                ['status', '--porcelain'],
                {
                    cwd: this.pathToTeddyRepo,
                    shell: false,
                    stdio: ['ignore', 'pipe', 'pipe']
                }
            );
            let stdout = '';
            let stderr = '';
            childProcess.stdout.on('data', data => {
                stdout += data.toString();
            });
            childProcess.stderr.on('data', data => {
                stderr += data.toString();
            });
            childProcess.on('error', reject);
            childProcess.on('close', code => {
                if ( code === 0 ) {
                    resolve(stdout.trim());
                    return;
                }
                const error = new Error(
                    `Git status failed with exit code ${code}.`
                );
                error.code = code;
                error.stderr = stderr;
                reject(error);
            });
        });
        if ( result.length > 0 ) {
            throw new Error(
                'The Teddy working tree is not clean. Commit, stash, or ' +
                'remove local changes before building a release.\n\n' +
                result
            );
        }
    }

    async #runTests() {
        const testCommands = [
            {
                label: 'Teddy test suite',
                args: ['run', 'test']
            },
            {
                label: 'Teddy upgrade test suite',
                args: ['run', 'test:upgrade']
            }
        ];
        for ( const testCommand of testCommands ) {
            try {
                logger.debug(`Running ${testCommand.label}...`);
                await new Promise((resolve, reject) => {
                    const childProcess = child.spawn(
                        'npm',
                        testCommand.args,
                        {
                            cwd: this.pathToTeddyRepo,
                            shell: false,
                            stdio: ['ignore', 'pipe', 'pipe'],
                            env: {
                                ...process.env,
                                CI: 'true',
                                NO_COLOR: '1',
                                FORCE_COLOR: '0',
                                TERM: 'dumb',
                                npm_config_progress: 'false',
                                npm_config_audit: 'false',
                                npm_config_fund: 'false'
                            }
                        }
                    );
                    let stdout = '';
                    let stderr = '';
                    childProcess.stdout.on('data', data => {
                        stdout += data.toString();
                    });
                    childProcess.stderr.on('data', data => {
                        stderr += data.toString();
                    });
                    childProcess.on('error', reject);
                    childProcess.on('close', code => {
                        if ( code === 0 ) {
                            resolve();
                            return;
                        }
                        const error = new Error(`${testCommand.label} ` + 
                            `failed with exit code ${code}.`);
                        error.code = code;
                        error.stdout = stdout;
                        error.stderr = stderr;
                        error.label = testCommand.label;
                        reject(error);
                    });
                });
            } catch (error) {
                const details = error.stderr ?? error.stdout ?? error.message;
                logger.error(details);
                throw new Error(
                    `${error.label ?? testCommand.label} failed ` +
                    `(exit code: ${error.code ?? 1}). Please consult the ` +
                    `logs for further details: ${details}`
                );
            }
        }
        this.testsPassed = true;
    }

    #createReleaseDirectory() {
        createDirectory(path.join(this.releaseDir, TEDDY_LABEL));
    }

    async #createArchives() {
        this.archiveBaseName = `${TEDDY_LABEL}-${this.version}`;
        const stagingRoot = resolvePathInsideBase(
            TEDDY_LABEL,
            this.releaseDir,
            'release staging root'
        );
        for ( const resource of 
            this.config.system.resources.directories.concat(
                this.config.system.resources.files) ) {
            const sourcePath = resolvePathInsideBase(
                resource,
                this.pathToTeddyRepo,
                `release source resource '${resource}'`
            );
            const targetPath = resolvePathInsideBase(
                resource,
                stagingRoot,
                `release target resource '${resource}'`
            );
            createDirectory(path.dirname(targetPath));
            fs.cpSync(sourcePath, targetPath, { 
                recursive: true, 
                preserveTimestamps: true
            });
        }
        this.tarPath = path.join(
            this.releaseDir, `${this.archiveBaseName}.tgz`);
        this.zipPath = path.join(
            this.releaseDir, `${this.archiveBaseName}.zip`);
        await tar(stagingRoot, this.tarPath);
        await zip(stagingRoot, this.zipPath);
    }

    #createChecksums() {
        const tarHash = sha256File(this.tarPath);
        const zipHash = sha256File(this.zipPath);
        const checksums = 
            `${tarHash}  ${this.archiveBaseName}.tgz\r\n` + 
            `${zipHash}  ${this.archiveBaseName}.zip`;
        const checksumFilename = `${TEDDY_LABEL}-${this.version}-checksums.txt`;
        writeStringToFile(checksums, path.join(
            this.releaseDir, checksumFilename));
    }

    async build() {
        try {

            logger.info(`Teddy repo: ${this.pathToTeddyRepo}`);
            logger.info('Building the release ...');

            // Validate the repository.
            logger.info('Stage 1 of 9 - Validating the repository...');
            this.#validateRepo();
            if ( this.repoIsValid ) {

                // Get the release version number.
                logger.info('Stage 2 of 9 - Retrieving the release ' + 
                    'version number...');
                this.#getReleaseVersion();

                // Empty the release directory if it exists.
                logger.info('Stage 3 of 9 - Emptying the release directory...');
                this.#emptyReleaseDirectory();

                // Check the version number matches the repo branch name.
                logger.info('Stage 4 of 9 - Checking the release ' + 
                    'version number...');
                this.#checkReleaseVersionMatchesRepoBranchName();
                if ( this.versionMatchesRepoBranchName ) {

                    // Check working tree cleanliness.
                    logger.info('Stage 5 of 9 - Checking working tree ' + 
                        'cleanliness...');
                    await this.#checkWorkingTreeIsClean();

                    // Run tests.
                    logger.info('Stage 6 of 9 - Running test suite...');
                    await this.#runTests();
                    if ( this.testsPassed ) {

                        // Create the release directory if it does not exist.
                        logger.info('Stage 7 of 9 - Creating the release ' + 
                            'directory...');
                        this.#createReleaseDirectory();

                        // Create the archive files.
                        logger.info('Stage 8 of 9 - Creating archives...');
                        await this.#createArchives();

                        // Create the checksums file.
                        logger.info('Stage 9 of 9 - Generating checksums...');
                        this.#createChecksums();

                        // Update the status code.
                        this.statusCode = 0;
                        logger.info('Successfully finished building ' + 
                            'the release!');
                        logger.info('Release version number: ' + 
                            this.version);
                        logger.info('Release build directory: ' + 
                            this.releaseDir);

                    }

                }

            }

        } catch (err) {
            logger.error(err.stack);
            try {
                this.#emptyReleaseDirectory();
            } catch (error) {
                logger.error('Could not empty the release build ' + 
                    'directory post-error.');
                logger.debug(error.stack);
            }
            throw new Error('An error was encountered whilst running the ' + 
                'release build pipeline. Please consult the logs for ' + 
                'further details: ' + err.stack);
        }
    }

}

export default ReleaseBuilder;
