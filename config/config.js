/**
 * Release builder configuration.
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
                `sites/travelbook/assets`, 
                `sites/travelbook/languages`, 
                `sites/travelbook/pages`, 
                `sites/travelbook/web`, 
                `system/`, 
                `themes/bear`
            ], 
            files: [
                `.gitignore`, 
                `build.js`, 
                `LICENSE`, 
                `package.json`, 
                `package-lock.json`, 
                `README.md`, 
                `sites/travelbook/site.json`
            ]
        }
    }
}

export default config;
