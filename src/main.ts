/* eslint-disable @typescript-eslint/no-unused-vars */
import fs from 'fs'
import {homedir} from 'os'

import {setFailed} from '@actions/core'
import * as core from '@actions/core'

import {
  fileExistsWithExtensions,
  getImportsRecursive,
  readFileWithExtensions
} from './getImports'

const home = homedir()

function run() {
  try {
    const fileIn = `${home}/programming/reform/boost/src/pages/index`
    const baseDir = `${home}/programming/reform/boost/src`

    const allImports = getImportsRecursive(fileIn, baseDir)

    console.log(allImports)
  } catch (error) {
    if (error instanceof Error) setFailed(error.message)
  }
}

run()
