"use strict";
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
const child_process_1 = require("child_process");
const fs_1 = __importDefault(require("fs"));
const util_1 = require("util");
const chrome_launcher_1 = require("chrome-launcher");
const lighthouse_1 = __importDefault(require("lighthouse"));
const SERVER_PORT = 9000;
const WORKING_DIR = '/Users/robbie/programming/reform/boost/';
function runComparison(pages, baseBranch, headBranch) {
    return __awaiter(this, void 0, void 0, function* () {
        // checkout the base branch
        yield checkoutBranch(baseBranch);
        yield build();
        const killServer = yield startServer();
        // run lighthouse on the base branch
        const baseResults = yield runLighthouse(pages, baseBranch);
        killServer();
        // checkout the head branch
        yield checkoutBranch(headBranch);
        yield build();
        const killServer2 = yield startServer();
        // run lighthouse on the head branch
        const headResults = yield runLighthouse(pages, headBranch);
        killServer2();
        // compare the results
        const comparison = compareResults(pages, baseResults, headResults);
        // return the comparison
        return comparison;
    });
}
exports.default = runComparison;
const execPromise = (0, util_1.promisify)(child_process_1.exec);
function checkoutBranch(branch) {
    return __awaiter(this, void 0, void 0, function* () {
        yield execPromise(`git checkout ${branch}`, {
            cwd: WORKING_DIR
        });
    });
}
function build() {
    return new Promise((resolve, reject) => {
        var _a, _b;
        // npm i && mpm run build
        // then resolve when the process exits
        // if exit code is 0, resolve
        // if exit code is not 0, reject
        const buildProcess = (0, child_process_1.exec)('npm i ', {
            cwd: WORKING_DIR,
            timeout: 1000 * 60 * 5
        });
        (_a = buildProcess.stdout) === null || _a === void 0 ? void 0 : _a.pipe(process.stdout);
        (_b = buildProcess.stderr) === null || _b === void 0 ? void 0 : _b.pipe(process.stderr);
        buildProcess.on('exit', code => {
            if (code === 0) {
                console.log('build finished successfully');
                resolve();
            }
            else {
                reject(new Error(`build exited with code ${code || 'unknown'}`));
            }
        });
    });
}
function runLighthouse(pages, branch) {
    return __awaiter(this, void 0, void 0, function* () {
        const results = pages.map(page => runSingleLighthouse(page, branch));
        return Promise.all(results);
    });
}
function runSingleLighthouse(pageIn, branch) {
    return __awaiter(this, void 0, void 0, function* () {
        // eslint doesn't like the lighthouse types
        /* eslint-disable */
        const page = pageIn.replace(/\.[tj]sx?$/, '');
        const url = `http://localhost:${SERVER_PORT}/${page === 'index' ? '' : page}`;
        console.log(`running lighthouse on ${page}`);
        const { lhr, report } = yield (0, lighthouse_1.default)(url, {
            output: ['json'],
            logLevel: 'info'
        });
        const escapeForCommandLine = (str) => {
            return str.replace(/"/g, '\\"');
        };
        // upload report to github pages
        const fileName = `${branch}/${page}/index.html`;
        const ReportGenerator = require('lighthouse/report/generator/report-generator');
        const reportToWrite = ReportGenerator.generateReport(lhr, 'html');
        yield execPromise(`
      (git switch gh-pages || git branch gh-pages)
      mkdir -p ${branch}
      mkdir -p ${branch}/${page}
      rm -f ${fileName}
    `
            .trim()
            .replace(/\n/g, '&&'), {
            cwd: WORKING_DIR
        });
        fs_1.default.writeFileSync(`${WORKING_DIR}${fileName}`, reportToWrite);
        yield execPromise(`
      git add ${fileName}
      git commit -m "add report for ${page} on ${branch}"
      git push origin gh-pages
      git switch -
    `
            .trim()
            .replace(/\n/g, '&&'), {
            cwd: WORKING_DIR
        });
        return {
            performance: lhr.categories.performance.score,
            accessibility: lhr.categories.accessibility.score,
            bestPractices: lhr.categories['best-practices'].score,
            seo: lhr.categories.seo.score,
            pwa: lhr.categories.pwa.score
        };
        /* eslint-enable */
    });
}
function compareResults(pages, baseResults, headResults) {
    // if the head result is null, use null for the comparison
    // if the base result is null, use Infinity for the comparison
    // if neither is null, use the difference between the two subtracted from 1
    const getComparisonResult = (base, head) => {
        if (head === null)
            return null;
        if (base === null)
            return Infinity;
        return 1 - (head - base);
    };
    const comparison = {};
    baseResults.forEach((baseResult, index) => {
        const headResult = headResults[index];
        comparison[pages[index]] = {
            performance: getComparisonResult(baseResult.performance, headResult.performance),
            accessibility: getComparisonResult(baseResult.accessibility, headResult.accessibility),
            bestPractices: getComparisonResult(baseResult.bestPractices, headResult.bestPractices),
            seo: getComparisonResult(baseResult.seo, headResult.seo),
            pwa: getComparisonResult(baseResult.pwa, headResult.pwa)
        };
    });
    return comparison;
}
/**
 * run npm serve and wait for it to be ready
 * returns a function to kill the server
 *
 */
const startServer = () => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    console.log('starting server');
    const server = (0, child_process_1.exec)('npm run serve', {
        cwd: WORKING_DIR
    });
    const chrome = new chrome_launcher_1.Launcher({
        chromeFlags: ['--headless', '--disable-gpu', '--no-sandbox'],
        port: 9222
    });
    (_a = server.stdout) === null || _a === void 0 ? void 0 : _a.pipe(process.stdout);
    const killServer = () => {
        server.kill();
        chrome.kill();
    };
    const ready = new Promise((resolve, reject) => {
        var _a;
        (_a = server.stdout) === null || _a === void 0 ? void 0 : _a.on('data', (data) => {
            if (data.includes('can now view')) {
                resolve(true);
                process.on('exit', () => {
                    killServer();
                });
            }
            else if (data.includes('already running')) {
                reject(new Error('server already running'));
                killServer();
            }
        });
    });
    yield Promise.all([ready, chrome.launch()]);
    return killServer;
});
