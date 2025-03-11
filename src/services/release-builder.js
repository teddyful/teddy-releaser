/**
 * Release builder service.
 *
 * @author jillurquddus
 * @since  0.0.1
 */

import * as child from 'child_process';
import fs from 'fs';
import sha256File from 'sha256-file';
import util from 'util';
import { deleteSync } from 'del';
import { tar, zip } from 'zip-a-folder';

import logger from '../middleware/logger.js';


class ReleaseBuilder {

    constructor(repo, config) {
        this.statusCode = 1;
        this.repo = repo;
        this.config = config;
        this.repoIsValid = false;
        this.testsPassed = false;
        this.version = null;
        this.releaseDir = null;
        this.archiveBaseName = null;
        this.tarPath = null;
        this.zipPath = null;
    }

    #validateRepo() {

        // Validate that the specified path points to a valid instance of 
        // Teddy by confirming the existence of the relevant core Teddy 
        // system resources.
        for ( const resource of this.config.system.resources.directories.concat(
            this.config.system.resources.files) ) {
            const resourcePath = `${this.repo}/${resource}`;
            if ( !fs.existsSync(resourcePath) ) {
                logger.error(new Error('The specified path ' + 
                    `'${this.repo}' does not point to a valid ` + 
                    'instance of Teddy, as the following resource is ' + 
                    `missing: '${resource}'.`));
                return;
            }
        }
        this.repoIsValid = true;

    }

    #getReleaseVersion() {
        const packageConfig = JSON.parse(fs.readFileSync(
            `${this.repo}/package.json`, 'utf8'));
        this.version = packageConfig.version;
    }

    #emptyReleaseDirectory() {
        this.releaseDir = `${this.config.releases.dir}/${this.version}`;
        if ( fs.existsSync(this.releaseDir) ) {
            deleteSync(this.releaseDir, {
                dot: true, 
                force: true
            });
        }
    }

    async #runTests() {
        const cmd = `npm run --prefix "${this.repo}" test`;
        const exec = util.promisify(child.exec);
        try {
            await exec(cmd);
            this.testsPassed = true;
        } catch (err) {
            logger.error(new Error('The specified instance of Teddy failed ' + 
                `one or more of its tests (exit code: ${err.code}). ` + 
                'Please consult the logs for further details.'));
            logger.debug(err.stderr);
        }
    }

    #createReleaseDirectory() {
        fs.mkdirSync(`${this.releaseDir}/teddy`, { recursive: true });
    }

    async #createArchives() {
        this.archiveBaseName = `teddy-${this.version}`;
        for ( const resource of 
            this.config.system.resources.directories.concat(
                this.config.system.resources.files) ) {
            const sourcePath = `${this.repo}/${resource}`;
            const targetPath = `${this.releaseDir}/teddy/${resource}`;
            fs.cpSync(sourcePath, targetPath, { 
                recursive: true, 
                preserveTimestamps: true     
            });
        }
        this.tarPath = `${this.releaseDir}/${this.archiveBaseName}.tgz`;
        this.zipPath = `${this.releaseDir}/${this.archiveBaseName}.zip`;
        await tar(`${this.releaseDir}/teddy`, this.tarPath);
        await zip(`${this.releaseDir}/teddy`, this.zipPath);
    }

    #createChecksums() {
        const tarHash = sha256File(this.tarPath);
        const zipHash = sha256File(this.zipPath);
        const checksums = 
            `${tarHash}  ${this.archiveBaseName}.tgz\r\n` + 
            `${zipHash}  ${this.archiveBaseName}.zip`;
        const checksumFilename = `teddy-${this.version}-checksums.txt`;
        fs.writeFileSync(`${this.releaseDir}/${checksumFilename}`, checksums, {
            encoding: 'utf-8'
        });
    }

    async build() {
        try {

            logger.info(`Teddy repo: ${this.repo}`);
            logger.info('Building the release ...');

            // Validate the repository.
            logger.info('Stage 1 of 7 - Validating the repository...');
            this.#validateRepo();

            if ( this.repoIsValid ) {

                // Get the release version number.
                logger.info(
                    'Stage 2 of 7 - Parsing the release version number...');
                this.#getReleaseVersion();

                // Empty the release directory if it exists.
                logger.info('Stage 3 of 7 - Clearing the release directory...');
                this.#emptyReleaseDirectory();

                // Run tests.
                logger.info('Stage 4 of 7 - Running tests...');
                await this.#runTests();

                if ( this.testsPassed ) {

                    // Create the release directory if it does not exist.
                    logger.info(
                        'Stage 5 of 7 - Creating the release directory...');
                    this.#createReleaseDirectory();

                    // Create the archive files.
                    logger.info('Stage 6 of 7 - Creating archives...');
                    await this.#createArchives();

                    // Create the checksums file.
                    logger.info('Stage 7 of 7 - Generating checksums...');
                    this.#createChecksums();

                    // Update the status code.
                    this.statusCode = 0;
                    logger.info('Successfully finished building the release!');
                    logger.info(`Release version number: ${this.version}`);
                    logger.info(`Release build directory: ${this.releaseDir}`);

                }

            }

        } catch (err) {
            logger.error('An error was encountered whilst running the ' + 
                'release build pipeline. Please consult the logs for ' + 
                'further details.');
            logger.error(err.stack);
            try {
                this.#emptyReleaseDirectory();
            } catch (error) {
                logger.error(
                    'Could not clear the release build directory post-error.');
                logger.debug(error.stack);
            }
        }
    }

}

export default ReleaseBuilder;
