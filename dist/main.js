"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/* eslint-disable @typescript-eslint/no-unused-vars */
const fs_1 = __importDefault(require("fs"));
const core_1 = require("@actions/core");
const core = __importStar(require("@actions/core"));
const getImports_1 = require("./getImports");
const lighthouse_1 = __importDefault(require("./lighthouse"));
// inputs are comma separated
const sampleInputs = {
    files_changed: `
    src/components/Page/Inner1216.tsx,
    src/images/Homepage/opportunity/illoBottom3.webp
  `,
    baseURL: 'src'
};
const workingDir = '/Users/robbie/programming/reform/boost';
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const allPages = getListOfPages();
            const filesChanged = sampleInputs.files_changed
                .split(',')
                .map(file => file.trim());
            const baseURL = `${workingDir}/${sampleInputs.baseURL}`;
            const pagesToCheck = new Set();
            allPages.forEach(pageIn => {
                const page = `${workingDir}/src/pages/${pageIn}`;
                console.log('checking page: ', pageIn);
                const dependencies = (0, getImports_1.getImportsRecursive)(page, baseURL);
                // if the page has a dependency on a file that has changed, add it to the list of pages to check
                dependencies.forEach(dependency => {
                    filesChanged.forEach(fileChanged => {
                        if (dependency.includes(fileChanged)) {
                            pagesToCheck.add(pageIn);
                        }
                        const fileChangedWithoutExtension = fileChanged.replace(/\.[^/.]+$/, '');
                        if (dependency.includes(fileChangedWithoutExtension)) {
                            pagesToCheck.add(pageIn);
                        }
                    });
                });
            });
            console.log('pages to check', pagesToCheck);
            const comparison = yield (0, lighthouse_1.default)(Array.from(pagesToCheck), 'main', 'main');
            console.log(comparison);
        }
        catch (error) {
            if (error instanceof Error)
                (0, core_1.setFailed)(error.message);
        }
    });
}
/**
 * get a list of all files under a directory, including subdirectories
 * @param dir
 */
const readDirRecursive = (dir) => {
    const files = fs_1.default.readdirSync(dir);
    const allFiles = [];
    files.forEach(file => {
        const fullPath = `${dir}/${file}`;
        if (fs_1.default.statSync(fullPath).isDirectory()) {
            allFiles.push(...readDirRecursive(fullPath));
        }
        else {
            allFiles.push(fullPath);
        }
    });
    return allFiles;
};
// get a list of all pages under the "src/pages" directory
const getListOfPages = () => {
    const pagesDir = `${workingDir}/src/pages`;
    const pages = readDirRecursive(pagesDir)
        .filter(file => file.endsWith('.tsx') && !file.endsWith('.test.tsx'))
        .map(file => file.replace(`${pagesDir}/`, ''));
    return pages;
};
run().catch((error) => {
    core.setFailed(error.message);
});
