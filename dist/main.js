"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@actions/core");
const getImports_1 = require("./getImports");
function run() {
    try {
        const fileIn = './index.tsx';
        const allImports = (0, getImports_1.getImportsRecursive)(fileIn);
        console.log(allImports);
    }
    catch (error) {
        if (error instanceof Error)
            (0, core_1.setFailed)(error.message);
    }
}
run();
