/**
 * Teddy release builder configuration.
 *
 * @author jillurquddus
 * @since  0.0.1
 */

// Core system resources.
const config = {
    releases: {
        dir: './releases'
    }, 
    system: {
        resources: {
            directories: [
                `config`, 
                `sites/travelbook`, 
                `system/`, 
                `themes/bear`
            ], 
            files: [
                `.gitignore`, 
                `gulpfile.js`, 
                `LICENSE`, 
                `package.json`, 
                `package-lock.json`, 
                `README.md`
            ]
        }
    }
}

export default config;
