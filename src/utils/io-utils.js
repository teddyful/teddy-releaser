/**
 * I/O utility functions.
 *
 * @author jillurquddus
 * @copyright Copyright (C) 2025 Jillur Quddus
 * @license GPL-3.0
 * @since 0.0.1
 */

import fs from 'fs';
import path from 'path';

// Test whether a given path exists.
function pathExists(sourcePath) {
    return fs.existsSync(sourcePath);
}

// Create a directory.
function createDirectory(dirPath, recursive = true) {
    if ( !fs.existsSync(dirPath) ) {
        fs.mkdirSync(dirPath, { recursive: recursive });
    }
}

// Load a file from the local filesystem and return a string.
function loadFile(sourceFilePath) {
    return fs.readFileSync(sourceFilePath, 'utf8');
}

// Load and parse a JSON file from the local filesystem.
function loadJsonFile(sourceFilePath) {
    let fileContent;
    try {
        fileContent = fs.readFileSync(sourceFilePath, 'utf8');
    } catch (error) {
        throw new Error(
            `Failed to read JSON file '${sourceFilePath}'.`,
            { cause: error }
        );
    }
    try {
        return JSON.parse(fileContent);
    } catch (error) {
        throw new Error(
            `Failed to parse JSON file '${sourceFilePath}'.`,
            { cause: error }
        );
    }
}

// Resolve a child path and assert that it remains inside the expected base path.
function resolvePathInsideBase(childPath, baseDirPath, label = 'path') {
    if ( typeof childPath !== 'string' || childPath.trim().length === 0 ) {
        throw new Error(`Invalid ${label}: path is empty.`);
    }
    const resolvedBasePath = path.resolve(baseDirPath);
    const resolvedChildPath = path.resolve(resolvedBasePath, childPath);
    const relativePath = path.relative(resolvedBasePath, resolvedChildPath);
    const isInsideBase = relativePath === '' ||
        (
            !relativePath.startsWith('..') &&
            !path.isAbsolute(relativePath)
        );
    if ( !isInsideBase ) {
        throw new Error(
            `Invalid ${label}: '${childPath}' resolves outside ` +
            `the expected base directory '${resolvedBasePath}'.`
        );
    }
    return resolvedChildPath;
}

// Write a string object to file.
function writeStringToFile(str, targetFilePath) {
    createDirectory(path.dirname(targetFilePath));
    fs.writeFileSync(targetFilePath, str, {encoding: 'utf8'});
}

export { 
    createDirectory, 
    loadFile, 
    loadJsonFile, 
    pathExists, 
    resolvePathInsideBase, 
    writeStringToFile
};
