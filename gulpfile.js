/**
 * Teddy release builder.
 *
 * @author jillurquddus
 * @since  0.0.1
 */

import gulp from 'gulp';

import config from './config/config.js';
import OptionsBuilder from './src/services/options-builder.js';
import ReleaseBuilder from './src/services/release-builder.js';

/* -----------------------------------------------------------------------------
 * 1. OPTIONS BUILDER
 * ---------------------------------------------------------------------------*/

// Options builder.
const args = process.argv.slice(2);
let optionsBuilder = new OptionsBuilder(args);
optionsBuilder.build();

/* -----------------------------------------------------------------------------
 * 2. RELEASE BUILDER SERVICES
 * ---------------------------------------------------------------------------*/

const releaseBuilder = new ReleaseBuilder(optionsBuilder.repoLocalPath, config);

/* -----------------------------------------------------------------------------
 * 3. TASKS
 * ---------------------------------------------------------------------------*/

// Build the release archives and checksums.
gulp.task('build-release', async function(done) {
    await releaseBuilder.build();
    done();
});

/* -----------------------------------------------------------------------------
 * 4. PIPELINES
 * ---------------------------------------------------------------------------*/

// Default pipeline.
gulp.task('default', gulp.series(
    'build-release'
));
