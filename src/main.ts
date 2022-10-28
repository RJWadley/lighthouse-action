/* eslint-disable @typescript-eslint/no-unused-vars */
import fs from 'fs'

import {setFailed} from '@actions/core'
import * as core from '@actions/core'

import {
  fileExistsWithExtensions,
  getImportsRecursive,
  readFileWithExtensions
} from './getImports'
import runComparison from './lighthouse'

// inputs are comma separated
const sampleInputs = {
  files_changed: `
    src/components/Page/Inner1216.tsx,
    src/images/Homepage/opportunity/illoBottom3.webp
  `,
  baseURL: 'src'
}

const workingDir = '/Users/robbie/programming/reform/boost'

async function run() {
  try {
    const allPages = getListOfPages()
    const filesChanged = sampleInputs.files_changed
      .split(',')
      .map(file => file.trim())
    const baseURL = `${workingDir}/${sampleInputs.baseURL}`
    const pagesToCheck = new Set<string>()

    allPages.forEach(pageIn => {
      const page = `${workingDir}/src/pages/${pageIn}`
      console.log('checking page: ', pageIn)
      const dependencies = getImportsRecursive(page, baseURL)

      // if the page has a dependency on a file that has changed, add it to the list of pages to check
      dependencies.forEach(dependency => {
        filesChanged.forEach(fileChanged => {
          if (dependency.includes(fileChanged)) {
            pagesToCheck.add(pageIn)
          }
          const fileChangedWithoutExtension = fileChanged.replace(
            /\.[^/.]+$/,
            ''
          )
          if (dependency.includes(fileChangedWithoutExtension)) {
            pagesToCheck.add(pageIn)
          }
        })
      })
    })

    console.log('pages to check', pagesToCheck)

    const comparison = await runComparison(
      Array.from(pagesToCheck),
      'main',
      'main'
    )

    console.log(comparison)
  } catch (error) {
    if (error instanceof Error) setFailed(error.message)
  }
}

/**
 * get a list of all files under a directory, including subdirectories
 * @param dir
 */
const readDirRecursive = (dir: string) => {
  const files = fs.readdirSync(dir)
  const allFiles: string[] = []

  files.forEach(file => {
    const fullPath = `${dir}/${file}`

    if (fs.statSync(fullPath).isDirectory()) {
      allFiles.push(...readDirRecursive(fullPath))
    } else {
      allFiles.push(fullPath)
    }
  })

  return allFiles
}

// get a list of all pages under the "src/pages" directory
const getListOfPages = () => {
  const pagesDir = `${workingDir}/src/pages`
  const pages = readDirRecursive(pagesDir)
    .filter(file => file.endsWith('.tsx') && !file.endsWith('.test.tsx'))
    .map(file => file.replace(`${pagesDir}/`, ''))

  return pages
}

run().catch((error: Error) => {
  core.setFailed(error.message)
})
