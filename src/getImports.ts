import fs from 'fs'
import path from 'path'

/**
 * given a file path, read the file
 * try various extensions
 * if none work, return undefined
 * @param fileIn file path
 */
export const readFileWithExtensions = (file: string): string | undefined => {
  const exts = ['.tsx', '.ts', '.jsx', '.js']
  const fileHasExtension = exts.some(ext => file.endsWith(ext))

  // if the file has an extension, try to read it
  if (fileHasExtension) return fs.readFileSync(file, 'utf8')

  // if the file doesn't have an extension, try to read it with each extension

  for (let i = 0; i < exts.length; i += 1) {
    const ext = exts[i]
    const fileWithExt = `${file}${ext}`
    const fileExists = fs.existsSync(fileWithExt)
    if (fileExists) return fs.readFileSync(fileWithExt, 'utf8')
  }

  // if none of the above worked, return undefined
  return undefined
}

/**
 * given a file path, check if it exists
 * try various extensions
 */
export const fileExistsWithExtensions = (file: string) => {
  const exts = ['.tsx', '.ts', '.jsx', '.js']
  const fileHasExtension = exts.some(ext => file.endsWith(ext))

  if (fileHasExtension) return fs.existsSync(file)

  for (let i = 0; i < exts.length; i += 1) {
    const ext = exts[i]
    const fileWithExt = `${file}${ext}`
    const fileExists = fs.existsSync(fileWithExt)
    console.log('checking ext', ext, fileWithExt, fileExists)
    if (fileExists) return true
  }

  return 'nope lol'
}

/**
 * given an imported file, return the real path to the file
 * @param fileName the imported file name to resolve
 * @param parentFile the file that is importing the file
 * @param baseDir the top level directory to use for resolving when the import is not relative
 * @returns the real path to the file
 */
export const resolvePath = (
  fileNameIn: string,
  parentFile: string,
  baseDir?: string
): string => {
  const fileName =
    baseDir && fileNameIn.startsWith(baseDir)
      ? fileNameIn.replace(baseDir, '')
      : fileNameIn
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
 * @param parentFile the file to parse
 * @returns a list of files imported by the file
 */
export const getImports = (parentFile: string, baseDir?: string) => {
  const fileContents = readFileWithExtensions(parentFile)
  if (!fileContents) return []
  const lines = fileContents.split('\n')

  const imports = lines.filter(line => line.startsWith('import'))

  const importFiles = imports
    .map(line => {
      const importedFile = /from ['"](.*)['"]/.exec(line)?.[1]

      return importedFile && resolvePath(importedFile, parentFile, baseDir)
    })
    .flatMap(file => (file ? [file] : []))
    // remove nonexistent files
    .filter(file => fileExistsWithExtensions(file))

  return importFiles
}

/**
 * given a file, return a list of imports recursively (ie. including imports of imports)
 * @param parentFile the file to parse
 * @returns a list of files imported by the file
 */
export const getImportsRecursive = (parentFile: string, baseDir?: string) => {
  const imports = getImports(parentFile)
  const visitedFiles = new Set<string>()

  const getImportsRecursiveHelper = (
    fileIn: string,
    recursedParent: string = parentFile
  ) => {
    const file = resolvePath(fileIn, recursedParent, baseDir)
    if (visitedFiles.has(file)) return

    visitedFiles.add(file)

    const newImports = getImports(file, baseDir)

    newImports.forEach(importedFile => {
      getImportsRecursiveHelper(importedFile, file)
    })
  }

  imports.forEach(importedFile => {
    getImportsRecursiveHelper(importedFile)
  })

  return Array.from(visitedFiles)
}
