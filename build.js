/**
 * Teddy release builder.
 *
 * @author jillurquddus
 * @copyright Copyright (C) 2025 Jillur Quddus
 * @license GPL-3.0
 * @since 0.0.1
 */

import path from 'path';
import { Command } from 'commander';

import logger from './src/middleware/logger.js';
import packageConfig from './package.json' with { type: 'json' };
import ReleaseBuilder from './src/services/release-builder.js';

/* -----------------------------------------------------------------------------
 * CLI with variadic options
 * ---------------------------------------------------------------------------*/

function printBanner() {
    console.log('');
    console.log('           _     _');
    console.log('          ( \\---/ )');
    console.log('           ) . . (');
    console.log(' ____,--._(___Y___)_,--.____');
    console.log("     `--'           `--'");
    console.log("        TEDDY RELEASER");
    console.log("         teddyful.com");
    console.log(' ___________________________');
    console.log('');
    console.log('');
}

const program = new Command();
program
    .name(packageConfig.name)
    .description(packageConfig.description)
    .version(packageConfig.version)
    .requiredOption(
        '--repo <repo>', 
        'Absolute path to the local Teddy repository (required)')
    .action(async function(opts) {
        printBanner();
        logger.info('Started the Teddy release builder app ' + 
            `(v${packageConfig.version}).`);
        if ( !path.isAbsolute(opts.repo) ) {
            throw new Error(
                "The '--repo <repo>' option must be an absolute path."
            );
        }
        const repoPath = path.resolve(opts.repo);
        const releaseBuilder = new ReleaseBuilder(repoPath);
        await releaseBuilder.build();
        logger.info('Exiting the Teddy release builder app ' + 
            `(exitCode = ${releaseBuilder.statusCode}).`);
        setTimeout(() => {
            process.exit(releaseBuilder.statusCode);
        }, 2000);
    })
    .showHelpAfterError()
    .showSuggestionAfterError();

try {
    await program.parseAsync();
} catch (error) {
    logger.error(error && error.stack ? error.stack : String(error));
    process.exitCode = 1;
}
