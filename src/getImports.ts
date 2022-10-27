import fs from 'fs'
import path from 'path'

/**
 * given an imported file, return the real path to the file
 * @param fileName the imported file name to resolve
 * @param parentFile the file that is importing the file
 * @param baseDir the top level directory to use for resolving when the import is not relative
 * @returns the real path to the file
 */
export const resolvePath = (
  fileName: string,
  parentFile: string,
  baseDir?: string
): string => {
  const isRelative = fileName.startsWith('./')
  const isParent = fileName.startsWith('../')

  if (isRelative) {
    return path.join(path.dirname(parentFile), fileName)
  }
  if (isParent) {
    if (fileName.startsWith('../../')) {
      throw new Error('Cannot resolve paths above the base directory')
    }
    return path.join(path.dirname(parentFile), fileName)
  }
  if (baseDir) {
    return path.join(baseDir, fileName)
  }
  return fileName
}

/**
 * given a typescript file, return a list of files imported by that file
 * @param file the file to parse
 * @returns a list of files imported by the file
 */
export const getImports = (file: string) => {
  const fileContents = fs.readFileSync(file, 'utf8')
  const lines = fileContents.split('\n')

  const imports = lines.filter(line => line.startsWith('import'))

  const importFiles = imports.map(line => {
    const importedFile = line
      .replace('import', '')
      .replace('from', '')
      .replace(';', '')
      .replace(/'/g, '')
      .trim()

    return importedFile
  })

  return importFiles
}

/**
 * given a file, return a list of imports recursively (ie. including imports of imports)
 * @param file the file to parse
 * @returns a list of files imported by the file
 */
export const getImportsRecursive = (file: string) => {
  const imports = getImports(file)
  const visitedFiles = new Set<string>()

  const getImportsRecursiveHelper = (recursedFile: string) => {
    if (visitedFiles.has(recursedFile)) return

    visitedFiles.add(recursedFile)

    const newImports = getImports(recursedFile)

    newImports.forEach(importedFile => {
      getImportsRecursiveHelper(importedFile)
    })
  }

  imports.forEach(importedFile => {
    getImportsRecursiveHelper(importedFile)
  })

  return Array.from(visitedFiles)
}
