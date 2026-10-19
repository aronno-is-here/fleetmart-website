import test from 'node:test'
import assert from 'node:assert/strict'
import {
  buildCategoryIndex,
  getCategoryFamily,
  getDescendants,
  resolveCategoryPath,
  sameStringArray,
} from '../services/taxonomy.js'

const root = { _id: '507f1f77bcf86cd799439001', id: 'jersey', parent: null }
const child = { _id: '507f1f77bcf86cd799439002', id: 'club', parent: root._id }
const leaf = { _id: '507f1f77bcf86cd799439003', id: 'premier', parent: child._id }
const other = { _id: '507f1f77bcf86cd799439004', id: 'boots', parent: null }

const categories = [root, child, leaf, other]

test('resolveCategoryPath derives the full slug path from parent links', () => {
  const index = buildCategoryIndex(categories)
  const resolved = resolveCategoryPath(index, 'premier')

  assert.equal(resolved.ok, true)
  assert.equal(resolved.category, leaf)
  assert.deepEqual(resolved.path, ['jersey', 'club', 'premier'])
  assert.equal(resolved.storedPath, `/${root._id}/${child._id}/`)
  assert.equal(resolved.level, 2)
})

test('resolveCategoryPath accepts object ids and rejects missing references', () => {
  const index = buildCategoryIndex(categories)
  assert.equal(resolveCategoryPath(index, child._id).category, child)
  assert.equal(resolveCategoryPath(index, 'missing').reason, 'not-found')
})

test('resolveCategoryPath detects missing parents and cycles', () => {
  const orphan = { _id: '507f1f77bcf86cd799439005', id: 'orphan', parent: 'missing-parent' }
  const orphanIndex = buildCategoryIndex([orphan])
  const orphanResult = resolveCategoryPath(orphanIndex, 'orphan')
  assert.equal(orphanResult.ok, false)
  assert.equal(orphanResult.reason, 'missing-parent')

  const a = { _id: '507f1f77bcf86cd799439006', id: 'a', parent: '507f1f77bcf86cd799439007' }
  const b = { _id: '507f1f77bcf86cd799439007', id: 'b', parent: '507f1f77bcf86cd799439006' }
  const cycleResult = resolveCategoryPath(buildCategoryIndex([a, b]), 'a')
  assert.equal(cycleResult.ok, false)
  assert.equal(cycleResult.reason, 'cycle')
})

test('getDescendants returns breadth-first descendants without looping', () => {
  const index = buildCategoryIndex(categories)
  assert.deepEqual(getDescendants(index, 'jersey'), [child, leaf])
  assert.deepEqual(getDescendants(index, 'premier'), [])

  const cyclicIndex = buildCategoryIndex([
    { ...root, parent: leaf._id },
    { ...child, parent: root._id },
    { ...leaf, parent: child._id },
  ])
  assert.deepEqual(getDescendants(cyclicIndex, 'jersey'), [child, leaf])
})

test('getCategoryFamily includes slug and object id references for filtering', () => {
  const index = buildCategoryIndex(categories)
  const family = getCategoryFamily(index, 'jersey')

  assert.equal(family.ok, true)
  assert.deepEqual(family.references, [
    'jersey', root._id,
    'club', child._id,
    'premier', leaf._id,
  ])
})

test('buildCategoryIndex reports duplicate slugs and sameStringArray compares paths', () => {
  const duplicate = { _id: '507f1f77bcf86cd799439008', id: 'jersey', parent: null }
  const index = buildCategoryIndex([root, duplicate])
  assert.deepEqual(index.duplicateSlugs, ['jersey'])
  assert.equal(sameStringArray(['a', 'b'], ['a', 'b']), true)
  assert.equal(sameStringArray(['a', 'b'], ['b', 'a']), false)
})
