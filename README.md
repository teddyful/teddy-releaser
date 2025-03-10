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
[5. Further Information](#information)<br/>
<br/>

## <a name="introduction"></a>1. Introduction

The Teddy releaser app creates the archive (.zip and .tgz) and checksum (SHA-256) files that must be attached to an official release of <a href="https://teddyful.com" target="_blank">Teddy</a>.

<p align="right"><a href="#readme-top">Back to Top &#9650;</a></p>

## <a name="usage"></a>2. Prerequisites

Please ensure that the following required software services are installed in your environment.

* [Git](https://git-scm.com/) - Distributed version control system.
* [Node.js](https://nodejs.org/) - JavaScript runtime environment.

<p align="right"><a href="#readme-top">Back to Top &#9650;</a></p>

## <a name="clone"></a>3. Setup

Clone the teddy-releaser app to a directory of your choice. Navigate into this directory and ensure that the `main` branch is checked out. Then install the required dependencies using NPM as follows.

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

To build a release, run either `npm run build` or `node build.js` with the following mandatory options.

#### --repo &lt;repo&gt;

The absolute path to the locally cloned Teddy repository that will be used to build a release of Teddy.

### Example

```
# Build a release of Teddy.
npm run build -- --repo /home/teddyful/teddy

           _     _
          ( \---/ )
           ) . . (
 ____,--._(___Y___)_,--.____
     `--'           `--'
            TEDDY
         teddyful.com
 ___________________________


2025-03-10 12:43:58.609 [Teddy Releaser] INFO: Started the Teddy release builder app (v0.0.1).
2025-03-10 12:43:58.610 [Teddy Releaser] INFO: Teddy repo: /home/teddyful/teddy
2025-03-10 12:43:58.611 [Teddy Releaser] INFO: Building the release ...
2025-03-10 12:43:58.611 [Teddy Releaser] INFO: Stage 1 of 5 - Validating the repository...
2025-03-10 12:43:58.612 [Teddy Releaser] INFO: Stage 2 of 5 - Parsing the release version number...
2025-03-10 12:43:58.613 [Teddy Releaser] INFO: Stage 3 of 5 - Creating the release directory...
2025-03-10 12:43:58.671 [Teddy Releaser] INFO: Stage 4 of 5 - Creating archives...
2025-03-10 12:44:01.511 [Teddy Releaser] INFO: Stage 5 of 5 - Generating checksums...
2025-03-10 12:44:01.531 [Teddy Releaser] INFO: Successfully finished building the release!
2025-03-10 12:44:01.531 [Teddy Releaser] INFO: Release version number: 0.0.1
2025-03-10 12:44:01.532 [Teddy Releaser] INFO: Release build directory: ./releases/0.0.1
```

### Help

Run `npm run build -- -h` or `node build.js -h` to see a complete list of usage options.

<p align="right"><a href="#readme-top">Back to Top &#9650;</a></p>

## <a name="information"></a>5. Further Information

For further information, please visit <a href="https://teddyful.com" target="_blank">teddyful.com</a>.

<p align="right"><a href="#readme-top">Back to Top &#9650;</a></p>
