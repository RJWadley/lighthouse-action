"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getImportsRecursive = exports.getImports = exports.resolvePath = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
/**
 * given an imported file, return the real path to the file
 * @param fileName the imported file name to resolve
 * @param parentFile the file that is importing the file
 * @param baseDir the top level directory to use for resolving when the import is not relative
 * @returns the real path to the file
 */
const resolvePath = (fileName, parentFile, baseDir) => {
    const isRelative = fileName.startsWith('./');
    const isParent = fileName.startsWith('../');
    if (isRelative) {
        return path_1.default.resolve(path_1.default.dirname(parentFile), fileName);
    }
    if (isParent) {
        const parentDir = path_1.default.dirname(parentFile);
        const fileNameClipped = fileName.slice(3);
        // resolve recursively until we find the file
        return (0, exports.resolvePath)(fileNameClipped, parentDir, baseDir);
    }
    return '';
};
exports.resolvePath = resolvePath;
/**
 * given a typescript file, return a list of files imported by that file
 * @param file the file to parse
 * @returns a list of files imported by the file
 */
const getImports = (file) => {
    const fileContents = fs_1.default.readFileSync(file, 'utf8');
    const lines = fileContents.split('\n');
    const imports = lines.filter(line => line.startsWith('import'));
    const importFiles = imports.map(line => {
        const importedFile = line
            .replace('import', '')
            .replace('from', '')
            .replace(';', '')
            .replace(/'/g, '')
            .trim();
        return importedFile;
    });
    return importFiles;
};
exports.getImports = getImports;
/**
 * given a file, return a list of imports recursively (ie. including imports of imports)
 * @param file the file to parse
 * @returns a list of files imported by the file
 */
const getImportsRecursive = (file) => {
    const imports = (0, exports.getImports)(file);
    const visitedFiles = new Set();
    const getImportsRecursiveHelper = (recursedFile) => {
        if (visitedFiles.has(recursedFile))
            return;
        visitedFiles.add(recursedFile);
        const newImports = (0, exports.getImports)(recursedFile);
        newImports.forEach(importedFile => {
            getImportsRecursiveHelper(importedFile);
        });
    };
    imports.forEach(importedFile => {
        getImportsRecursiveHelper(importedFile);
    });
    return Array.from(visitedFiles);
};
exports.getImportsRecursive = getImportsRecursive;
