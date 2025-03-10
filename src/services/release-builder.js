/**
 * Release builder service.
 *
 * @author jillurquddus
 * @since  0.0.1
 */

import fs from 'fs';
import sha256File from 'sha256-file';
import { deleteSync } from 'del';
import { tar, zip } from 'zip-a-folder';

import logger from '../middleware/logger.js';


class ReleaseBuilder {

    constructor(repo, config) {
        this.repo = repo;
        this.config = config;
        this.repoIsValid = false;
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
        logger.info('Stage 1 of 5 - Validating the repository...');
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
        logger.info('Stage 2 of 5 - Parsing the release version number...');
        const packageConfig = JSON.parse(fs.readFileSync(
            `${this.repo}/package.json`, 'utf8'));
        this.version = packageConfig.version;
    }

    #createReleaseDirectory() {
        logger.info('Stage 3 of 5 - Creating the release directory...');
        this.releaseDir = `${this.config.releases.dir}/${this.version}`;
        if ( fs.existsSync(this.releaseDir) ) {
            deleteSync(this.releaseDir, {
                dot: true, 
                force: true
            });
        }
        fs.mkdirSync(`${this.releaseDir}/teddy`, { recursive: true });
    }

    async #createArchives() {
        logger.info('Stage 4 of 5 - Creating archives...');
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
        logger.info('Stage 5 of 5 - Generating checksums...');
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

        logger.info(`Teddy repo: ${this.repo}`);
        logger.info('Building the release ...');
        this.#validateRepo();
        if ( this.repoIsValid ) {

            // Get the release version number.
            this.#getReleaseVersion();

            // Create the release directory if it does not already exist.
            this.#createReleaseDirectory();

            // Create the archive files.
            await this.#createArchives();

            // Create the checksums file.
            this.#createChecksums();

            // Confirmation logging.
            logger.info('Successfully finished building the release!');
            logger.info(`Release version number: ${this.version}`);
            logger.info(`Release build directory: ${this.releaseDir}`);

        }
    }

}

export default ReleaseBuilder;
