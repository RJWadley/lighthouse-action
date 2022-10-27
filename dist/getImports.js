"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getImportsRecursive = exports.getImports = exports.resolvePath = exports.fileExistsWithExtensions = exports.readFileWithExtensions = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
/**
 * given a file path, read the file
 * try various extensions
 * if none work, return undefined
 * @param fileIn file path
 */
const readFileWithExtensions = (file) => {
    const exts = ['.tsx', '.ts', '.jsx', '.js'];
    const fileHasExtension = exts.some(ext => file.endsWith(ext));
    // if the file has an extension, try to read it
    if (fileHasExtension)
        return fs_1.default.readFileSync(file, 'utf8');
    // if the file doesn't have an extension, try to read it with each extension
    for (let i = 0; i < exts.length; i += 1) {
        const ext = exts[i];
        const fileWithExt = `${file}${ext}`;
        const fileExists = fs_1.default.existsSync(fileWithExt);
        if (fileExists)
            return fs_1.default.readFileSync(fileWithExt, 'utf8');
    }
    // if none of the above worked, return undefined
    return undefined;
};
exports.readFileWithExtensions = readFileWithExtensions;
/**
 * given a file path, check if it exists
 * try various extensions
 */
const fileExistsWithExtensions = (file) => {
    const exts = ['.tsx', '.ts', '.jsx', '.js'];
    const fileHasExtension = exts.some(ext => file.endsWith(ext));
    if (fileHasExtension)
        return fs_1.default.existsSync(file);
    for (let i = 0; i < exts.length; i += 1) {
        const ext = exts[i];
        const fileWithExt = `${file}${ext}`;
        const fileExists = fs_1.default.existsSync(fileWithExt);
        console.log('checking ext', ext, fileWithExt, fileExists);
        if (fileExists)
            return true;
    }
    return 'nope lol';
};
exports.fileExistsWithExtensions = fileExistsWithExtensions;
/**
 * given an imported file, return the real path to the file
 * @param fileName the imported file name to resolve
 * @param parentFile the file that is importing the file
 * @param baseDir the top level directory to use for resolving when the import is not relative
 * @returns the real path to the file
 */
const resolvePath = (fileNameIn, parentFile, baseDir) => {
    const fileName = baseDir && fileNameIn.startsWith(baseDir)
        ? fileNameIn.replace(baseDir, '')
        : fileNameIn;
    const isRelative = fileName.startsWith('./');
    const isParent = fileName.startsWith('../');
    if (isRelative) {
        return path_1.default.join(path_1.default.dirname(parentFile), fileName);
    }
    if (isParent) {
        if (fileName.startsWith('../../')) {
            throw new Error('Cannot resolve paths above the base directory');
        }
        return path_1.default.join(path_1.default.dirname(parentFile), fileName);
    }
    if (baseDir) {
        return path_1.default.join(baseDir, fileName);
    }
    return fileName;
};
exports.resolvePath = resolvePath;
/**
 * given a typescript file, return a list of files imported by that file
 * @param parentFile the file to parse
 * @returns a list of files imported by the file
 */
const getImports = (parentFile, baseDir) => {
    const fileContents = (0, exports.readFileWithExtensions)(parentFile);
    if (!fileContents)
        return [];
    const lines = fileContents.split('\n');
    const imports = lines.filter(line => line.startsWith('import'));
    const importFiles = imports
        .map(line => {
        var _a;
        const importedFile = (_a = /from ['"](.*)['"]/.exec(line)) === null || _a === void 0 ? void 0 : _a[1];
        return importedFile && (0, exports.resolvePath)(importedFile, parentFile, baseDir);
    })
        .flatMap(file => (file ? [file] : []))
        // remove nonexistent files
        .filter(file => (0, exports.fileExistsWithExtensions)(file));
    return importFiles;
};
exports.getImports = getImports;
/**
 * given a file, return a list of imports recursively (ie. including imports of imports)
 * @param parentFile the file to parse
 * @returns a list of files imported by the file
 */
const getImportsRecursive = (parentFile, baseDir) => {
    const imports = (0, exports.getImports)(parentFile);
    const visitedFiles = new Set();
    const getImportsRecursiveHelper = (fileIn, recursedParent = parentFile) => {
        const file = (0, exports.resolvePath)(fileIn, recursedParent, baseDir);
        if (visitedFiles.has(file))
            return;
        visitedFiles.add(file);
        const newImports = (0, exports.getImports)(file, baseDir);
        newImports.forEach(importedFile => {
            getImportsRecursiveHelper(importedFile, file);
        });
    };
    imports.forEach(importedFile => {
        getImportsRecursiveHelper(importedFile);
    });
    return Array.from(visitedFiles);
};
exports.getImportsRecursive = getImportsRecursive;
