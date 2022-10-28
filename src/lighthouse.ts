import {exec} from 'child_process'
import {promisify} from 'util'

import {Launcher} from 'chrome-launcher'
import lighthouse from 'lighthouse'

interface LighthouseReport {
  performance: number | null
  accessibility: number | null
  bestPractices: number | null
  seo: number | null
  pwa: number | null
}

interface ComparisonResult {
  [key: string]: LighthouseReport
}

const SERVER_PORT = 9000
const WORKING_DIR = '/Users/robbie/programming/reform/boost/'

export default async function runComparison(
  pages: string[],
  baseBranch: string,
  headBranch: string
): Promise<ComparisonResult> {
  // checkout the base branch
  await checkoutBranch(baseBranch)
  await build()
  const killServer = await startServer()
  // run lighthouse on the base branch
  const baseResults = await runLighthouse(pages)
  killServer()
  // checkout the head branch
  await checkoutBranch(headBranch)
  await build()
  const killServer2 = await startServer()
  // run lighthouse on the head branch
  const headResults = await runLighthouse(pages)
  killServer2()
  // compare the results
  const comparison = compareResults(pages, baseResults, headResults)
  // return the comparison
  return comparison
}

const execPromise = promisify(exec)
async function checkoutBranch(branch: string) {
  await execPromise(`git checkout ${branch}`, {
    cwd: WORKING_DIR
  })
}

function build() {
  return new Promise<void>((resolve, reject) => {
    // npm i && mpm run build
    // then resolve when the process exits
    // if exit code is 0, resolve
    // if exit code is not 0, reject
    const buildProcess = exec('npm i', {
      cwd: WORKING_DIR, // TODO also build
      timeout: 1000 * 60 * 5
    })
    buildProcess.stdout?.pipe(process.stdout)
    buildProcess.stderr?.pipe(process.stderr)
    buildProcess.on('exit', code => {
      if (code === 0) {
        console.log('build finished successfully')
        resolve()
      } else {
        reject(new Error(`build exited with code ${code || 'unknown'}`))
      }
    })
  })
}

async function runLighthouse(pages: string[]): Promise<LighthouseReport[]> {
  const results = pages.map(page => runSingleLighthouse(page))
  return Promise.all(results)
}

async function runSingleLighthouse(pageIn: string): Promise<LighthouseReport> {
  // eslint doesn't like the lighthouse types
  /* eslint-disable */
  const page = pageIn.replace(/\.[tj]sx?$/, '')
  const url = `https://localhost:${SERVER_PORT}/${page === 'index' ? '' : page}`

  console.log(`running lighthouse on ${page}`)
  const {lhr} = await lighthouse('https://www.google.com', {
    output: ['json'],
    logLevel: 'verbose'
  })

  return {
    performance: lhr.categories.performance.score,
    accessibility: lhr.categories.accessibility.score,
    bestPractices: lhr.categories['best-practices'].score,
    seo: lhr.categories.seo.score,
    pwa: lhr.categories.pwa.score
  }

  /* eslint-enable */
}

function compareResults(
  pages: string[],
  baseResults: LighthouseReport[],
  headResults: LighthouseReport[]
): ComparisonResult {
  // if the head result is null, use null for the comparison
  // if the base result is null, use Infinity for the comparison
  // if neither is null, use the difference between the two subtracted from 1
  const getComparisonResult = (
    base: number | null,
    head: number | null
  ): number | null => {
    if (head === null) return null
    if (base === null) return Infinity
    return 1 - (head - base)
  }

  const comparison: ComparisonResult = {}

  baseResults.forEach((baseResult, index) => {
    const headResult = headResults[index]
    comparison[pages[index]] = {
      performance: getComparisonResult(
        baseResult.performance,
        headResult.performance
      ),
      accessibility: getComparisonResult(
        baseResult.accessibility,
        headResult.accessibility
      ),
      bestPractices: getComparisonResult(
        baseResult.bestPractices,
        headResult.bestPractices
      ),
      seo: getComparisonResult(baseResult.seo, headResult.seo),
      pwa: getComparisonResult(baseResult.pwa, headResult.pwa)
    }
  })

  return comparison
}

/**
 * run npm serve and wait for it to be ready
 * returns a function to kill the server
 *
 */
const startServer = async () => {
  console.log('starting server')
  const server = exec('npm run serve', {
    cwd: WORKING_DIR
  })
  const chrome = new Launcher({
    chromeFlags: ['--headless', '--disable-gpu', '--no-sandbox'],
    port: 9222
  })
  server.stdout?.pipe(process.stdout)
  const killServer = () => {
    server.kill()
    chrome.kill()
  }
  const ready = new Promise((resolve, reject) => {
    server.stdout?.on('data', (data: string) => {
      if (data.includes('can now view')) {
        resolve(true)

        process.on('exit', () => {
          killServer()
        })
      } else if (data.includes('already running')) {
        reject(new Error('server already running'))
        killServer()
      }
    })
  })
  await Promise.all([ready, chrome.launch()])
  return killServer
}
