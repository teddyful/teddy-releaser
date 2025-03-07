/**
 * Options builder service.
 *
 * @author jillurquddus
 * @since  0.0.1
 */

// Available options.
const REPO_LOCAL_PATH = '--repo-local-path';

class OptionsBuilder {

    constructor(args) {
        this.args = args;
        this.repoLocalPath = null;
    }

    build() {

        // Absolute path to the locally cloned Teddy repository.
        if ( !this.args.includes(REPO_LOCAL_PATH) ) {
            throw new Error('The absolute path to the local Teddy repo is ' + 
                'missing. Please provide this path as a command line ' + 
                'argument to the release builder application in the format ' + 
                `${REPO_LOCAL_PATH} [path], for example: ` + 
                '--repo-local-path /home/teddyful/teddy');
        }
        const repoLocalPathKeyIdx = this.args.indexOf(REPO_LOCAL_PATH);
        this.repoLocalPath = this.args[repoLocalPathKeyIdx + 1];

    }


}

export default OptionsBuilder;
