"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const os_1 = require("os");
const core_1 = require("@actions/core");
const getImports_1 = require("./getImports");
const home = (0, os_1.homedir)();
function run() {
    try {
        const fileIn = `${home}/programming/reform/boost/src/pages/index`;
        const baseDir = `${home}/programming/reform/boost/src`;
        const allImports = (0, getImports_1.getImportsRecursive)(fileIn, baseDir);
        console.log(allImports);
    }
    catch (error) {
        if (error instanceof Error)
            (0, core_1.setFailed)(error.message);
    }
}
run();
