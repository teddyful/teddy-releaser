/**
 * Teddy release builder.
 *
 * @author jillurquddus
 * @since  0.0.1
 */

import { Command } from 'commander';

import config from './config/config.js';
import logger from './src/middleware/logger.js';
import packageConfig from './package.json' with { type: 'json' };
import ReleaseBuilder from './src/services/release-builder.js';


console.log('');
console.log('           _     _');
console.log('          ( \\---/ )');
console.log('           ) . . (');
console.log(' ____,--._(___Y___)_,--.____');
console.log("     `--'           `--'");
console.log("            TEDDY");
console.log("         teddyful.com");
console.log(' ___________________________');
console.log('');
console.log('');

/* -----------------------------------------------------------------------------
 * CLI with variadic options
 * ---------------------------------------------------------------------------*/

const program = new Command();
program.name(packageConfig.name)
    .description(packageConfig.description)
    .version(packageConfig.version)
    .requiredOption('--repo <repo>', 
        'Absolute path to the local Teddy repository (required)')
    .action(async function(opts) {
        logger.info('Started the Teddy release builder app ' + 
            `(v${packageConfig.version}).`);
        const releaseBuilder = new ReleaseBuilder(opts.repo, config);
        await releaseBuilder.build();
        logger.info('Exiting the Teddy release builder app (exitCode = ' + 
            `${releaseBuilder.statusCode}).`);
        setTimeout(() => {
            process.exit(releaseBuilder.statusCode);
        }, 2000);
    })
program.parse();
