<a name="readme-top"></a>
<div align="center">
<h1>Teddy Releaser</h1>
<p>Create a release of Teddy.</p>
<p><a href="https://teddyful.com" target="_blank">teddyful.com</a></p>
</div>

## Table of Contents  
[1. Introduction](#introduction)<br/>
[2. Prerequisites](#prerequisites)<br/>
[3. Setup](#setup)<br/>
[4. Usage](#usage)<br/>
[5. Release Checklist](#release-checklist)<br/>
[6. Further Information](#information)<br/>
<br/>

## <a name="introduction"></a>1. Introduction

The Teddy releaser app runs all tests and then creates the archive (.zip and .tgz) and checksum (SHA-256) files that must be attached to an official release of <a href="https://github.com/teddyful/teddy" target="_blank">Teddy</a>.

<p align="right"><a href="#readme-top">Back to Top &#9650;</a></p>

## <a name="prerequisites"></a>2. Prerequisites

Please ensure that the following required software services are installed in your environment.

* <a href="https://git-scm.com/" target="_blank">Git</a> - Distributed version control system.
* <a href="https://nodejs.org/" target="_blank">Node.js</a> - JavaScript runtime environment.

<p align="right"><a href="#readme-top">Back to Top &#9650;</a></p>

## <a name="setup"></a>3. Setup

Clone the `teddy-releaser` repository to a directory of your choice. Navigate into this directory and ensure that the `main` branch is checked out. Then install the required dependencies using NPM as follows.

```
# Clone the teddy-releaser app.
git clone https://github.com/teddyful/teddy-releaser.git

# Navigate into teddy-releaser.
cd teddy-releaser

# Checkout the main branch (default).
git checkout main

# Install the required dependencies.
npm install
```

<p align="right"><a href="#readme-top">Back to Top &#9650;</a></p>

## <a name="usage"></a>4. Usage

### Build a Release

To build a release, run either `npm run build` or `node build.js` and provide the following mandatory command-line arguments.

#### --repo &lt;repo&gt;

The absolute path to the local <a href="https://github.com/teddyful/teddy" target="_blank">Teddy repository</a> that will be used to build a release of Teddy.

### Example

```
# Build a release of Teddy.
npm run build -- --repo /home/teddyful/teddy

           _     _
          ( \---/ )
           ) . . (
 ____,--._(___Y___)_,--.____
     `--'           `--'
        TEDDY RELEASER
         teddyful.com
 ___________________________


2026-06-29 17:42:42.009 [Teddy Releaser] INFO: Started the Teddy release builder app (v0.0.1).
2026-06-29 17:42:42.010 [Teddy Releaser] INFO: Teddy repo: /home/teddyful/teddy
2026-06-29 17:42:42.010 [Teddy Releaser] INFO: Building the release ...
2026-06-29 17:42:42.010 [Teddy Releaser] INFO: Stage 1 of 9 - Validating the repository...
2026-06-29 17:42:42.010 [Teddy Releaser] INFO: Stage 2 of 9 - Retrieving the release version number...
2026-06-29 17:42:42.010 [Teddy Releaser] INFO: Stage 3 of 9 - Emptying the release directory...
2026-06-29 17:42:42.011 [Teddy Releaser] INFO: Stage 4 of 9 - Checking the release version number...
2026-06-29 17:42:42.019 [Teddy Releaser] INFO: Stage 5 of 9 - Checking working tree cleanliness...
2026-06-29 17:42:42.026 [Teddy Releaser] INFO: Stage 6 of 9 - Running test suite...
2026-06-29 17:42:42.027 [Teddy Releaser] DEBUG: Running Teddy test suite...
2026-06-29 17:42:43.443 [Teddy Releaser] DEBUG: Running Teddy upgrade test suite...
2026-06-29 17:42:50.261 [Teddy Releaser] INFO: Stage 7 of 9 - Creating the release directory...
2026-06-29 17:42:50.261 [Teddy Releaser] INFO: Stage 8 of 9 - Creating archives...
2026-06-29 17:42:52.680 [Teddy Releaser] INFO: Stage 9 of 9 - Generating checksums...
2026-06-29 17:42:52.722 [Teddy Releaser] INFO: Successfully finished building the release!
2026-06-29 17:42:52.722 [Teddy Releaser] INFO: Release version number: 0.0.15
2026-06-29 17:42:52.722 [Teddy Releaser] INFO: Release build directory: /home/teddyful/teddy-releaser/working/releases/0.0.15
2026-06-29 17:42:52.723 [Teddy Releaser] INFO: Exiting the Teddy release builder app (exitCode = 0).
```

### Help

Run `npm run build -- -h` or `node build.js -h` to see a complete list of usage options.

### Release Files

The built release files will be created in `teddy-releaser/working/releases/{version}`, where `{version}` is extracted from `{repo}/package.json`, and consist of the following:

* teddy-{version}.tgz
* teddy-{version}.zip
* teddy-{version}-checksums.txt (SHA-256 and hex encoding)

Note that if any of the tests fail, then the release files will not be created.

<p align="right"><a href="#readme-top">Back to Top &#9650;</a></p>

## <a name="release-checklist"></a>5. Release Checklist

Before publishing a Teddy release, follow the checklist in
[`RELEASE_CHECKLIST.md`](RELEASE_CHECKLIST.md).

<p align="right"><a href="#readme-top">Back to Top &#9650;</a></p>

## <a name="information"></a>6. Further Information

For further information, please visit <a href="https://teddyful.com" target="_blank">teddyful.com</a>.

<p align="right"><a href="#readme-top">Back to Top &#9650;</a></p>
