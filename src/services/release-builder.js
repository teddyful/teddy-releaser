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

    constructor(repoLocalPath, config) {
        this.repoLocalPath = repoLocalPath;
        this.config = config;
        this.repoLocalPathIsValid = false;
    }

    #validateRepoLocalPath() {

        // Validate that the specified path points to a valid instance of 
        // Teddy by confirming the existence of the relevant core Teddy 
        // system resources.
        for ( const resource of this.config.system.resources.directories.concat(
            this.config.system.resources.files) ) {
            const resourcePath = `${this.repoLocalPath}/${resource}`;
            if ( !fs.existsSync(resourcePath) ) {
                logger.error(new Error('The specified path ' + 
                    `'${this.repoLocalPath}' does not point to a valid ` + 
                    'instance of Teddy, as the following resource is ' + 
                    `missing: '${resource}'.`));
                return;
            }
        }
        this.repoLocalPathIsValid = true;

    }

    async build() {

        console.log('');
        console.log('           _     _');
        console.log('          ( \\---/ )');
        console.log('           ) . . (');
        console.log('_____,--._(___Y___)_,--._____');
        console.log("     `--'           `--'");
        console.log('');
        logger.info(`Teddy repo local path: ${this.repoLocalPath}`);
        logger.info('Building the release ...');
        logger.info('Stage 1 of 5 - Validating the repository...');
        this.#validateRepoLocalPath();
        if ( this.repoLocalPathIsValid ) {

            // Get the release version number.
            logger.info('Stage 2 of 5 - Parsing the release version number...');
            const packageConfig = JSON.parse(fs.readFileSync(
                `${this.repoLocalPath}/package.json`, 'utf8'));
            const version = packageConfig.version;

            // Create the releases directory if it does not already exist.
            logger.info('Stage 3 of 5 - Creating the releases directory...');
            const releaseDir = `${this.config.releases.dir}/${version}`;
            if ( fs.existsSync(releaseDir) ) {
                deleteSync(releaseDir, {
                    dot: true, 
                    force: true
                });
            }
            fs.mkdirSync(`${releaseDir}/teddy`, { recursive: true });

            // Create the archive files.
            logger.info('Stage 4 of 5 - Creating archives...');
            const archiveBaseName = `teddy-${version}`;
            for ( const resource of 
                this.config.system.resources.directories.concat(
                    this.config.system.resources.files) ) {
                const sourcePath = `${this.repoLocalPath}/${resource}`;
                const targetPath = `${releaseDir}/teddy/${resource}`;
                fs.cpSync(sourcePath, targetPath, { 
                    recursive: true, 
                    preserveTimestamps: true     
                });
            }
            const tarPath = `${releaseDir}/${archiveBaseName}.tgz`;
            const zipPath = `${releaseDir}/${archiveBaseName}.zip`;
            await tar(`${releaseDir}/teddy`, tarPath);
            await zip(`${releaseDir}/teddy`, zipPath);

            // Create the checksums file.
            logger.info('Stage 5 of 5 - Generating checksums...');
            const tarHash = sha256File(tarPath);
            const zipHash = sha256File(zipPath);
            const checksums = 
                `${tarHash}  ${archiveBaseName}.tgz\r\n` + 
                `${zipHash}  ${archiveBaseName}.zip`;
            const checksumFilename = `teddy-${version}-checksums.txt`;
            fs.writeFileSync(`${releaseDir}/${checksumFilename}`, checksums, {
                encoding: 'utf-8'
            });

            // Confirmation logging.
            logger.info('Successfully finished building the release.');
            logger.info(`Release version number: ${version}`);
            logger.info(`Release build directory: ${releaseDir}`);

        }
    }

}

export default ReleaseBuilder;
