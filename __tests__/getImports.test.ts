import * as process from 'process'
import * as cp from 'child_process'
import * as path from 'path'
import {expect, test} from '@jest/globals'

import {resolvePath} from '../src/getImports'

/**
 * resolve relative paths
 *
 * given the following files:
 * - src/index.ts
 * - src/one.ts
 *
 * and the following import in src/index.ts:
 * import {one} from './one'
 *
 * return the path src/one
 */
test('resolve relative paths', () => {
  const importUrl = './one'
  const parentFile = path.join(process.cwd(), 'src', 'index.ts')
  const baseDir = 'Illegal base dir'
  const expected = path.join(process.cwd(), 'src', 'one')
  const actual = resolvePath(importUrl, parentFile, baseDir)

  expect(actual).toBe(expected)
})

/**
 * resolve parent paths
 *
 * given the following files:
 * - src/index.ts
 * - src/folder/one.ts
 *
 * and the following import in src/one.ts:
 * import {one} from '../index'
 *
 * return the path src/index
 */
test('resolve parent paths', () => {
  const importUrl = '../index'
  const parentFile = path.join(process.cwd(), 'src', 'folder', 'one.ts')
  const baseDir = 'Illegal base dir'
  const expected = path.join(process.cwd(), 'src', 'index')
  const actual = resolvePath(importUrl, parentFile, baseDir)

  expect(actual).toBe(expected)
})

/**
 * resolve base paths
 *
 * given the following files:
 * - src/index.ts
 * - src/folder/one.ts
 * - src/folder/two.ts
 *
 * and the following import in src/folder/one.ts:
 * import {two} from 'folder/two'
 *
 * and a baseDir of src
 *
 * return the path src/folder/two
 */
test('resolve base paths', () => {
  const importUrl = 'folder/two'
  const parentFile = path.join(process.cwd(), 'src', 'folder', 'one.ts')
  const baseDir = path.join(process.cwd(), 'src')
  const expected = path.join(process.cwd(), 'src', 'folder', 'two')
  const actual = resolvePath(importUrl, parentFile, baseDir)

  expect(actual).toBe(expected)
})

/**
 * resolve absolute paths
 *
 * given the following files:
 * - /Users/username/src/index.ts
 * - /Users/username/src/folder/one.ts
 *
 * and the following import in /Users/username/src/folder/one.ts:
 * import {one} from '/Users/username/src/index'
 *
 * return the path /Users/username/src/index
 */
test('resolve absolute paths', () => {
  const importUrl = '/Users/username/src/index'
  const parentFile = '/Users/username/src/folder/one.ts'
  const baseDir = '/Users/username/src'
  const expected = '/Users/username/src/index'
  const actual = resolvePath(importUrl, parentFile, baseDir)

  expect(actual).toBe(expected)
})
