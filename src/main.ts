/* eslint-disable @typescript-eslint/no-unused-vars */
import fs from 'fs'

import {setFailed} from '@actions/core'
import * as core from '@actions/core'

import {getImportsRecursive} from './getImports'

function run() {
  try {
    const fileIn = './index.tsx'

    const allImports = getImportsRecursive(fileIn)

    console.log(allImports)
  } catch (error) {
    if (error instanceof Error) setFailed(error.message)
  }
}

run()
