import test from 'node:test'
import assert from 'node:assert/strict'
import {
  collectDescendantIds,
  collectExpandableIds,
  filterCategoryTree,
  findCategoryPath,
  flattenCategoryTree,
} from './categoryTree.js'

const tree = [
  {
    _id: '1',
    id: 'jersey',
    name: 'Jerseys',
    children: [
      {
        _id: '2',
        id: 'club',
        name: 'Club Kits',
        children: [
          { _id: '3', id: 'premier', name: 'Premier League', children: [] },
        ],
      },
    ],
  },
  { _id: '4', id: 'boots', name: 'Boots', children: [] },
]

test('flattenCategoryTree returns stable ids with depth', () => {
  assert.deepEqual(
    flattenCategoryTree(tree).map(({ id, depth }) => [id, depth]),
    [['jersey', 0], ['club', 1], ['premier', 2], ['boots', 0]]
  )
})

test('findCategoryPath returns the full ancestor chain for a nested id', () => {
  assert.deepEqual(findCategoryPath(tree, 'premier').map((n) => n.id), ['jersey', 'club', 'premier'])
  assert.deepEqual(findCategoryPath(tree, 'missing'), [])
})

test('collectDescendantIds returns nested descendants only', () => {
  assert.deepEqual(collectDescendantIds(tree, 'jersey'), ['club', 'premier'])
  assert.deepEqual(collectDescendantIds(tree, 'premier'), [])
})

test('filterCategoryTree keeps matching nested nodes and their ancestors', () => {
  const filtered = filterCategoryTree(tree, 'premier')
  assert.equal(filtered.length, 1)
  assert.equal(filtered[0].id, 'jersey')
  assert.equal(filtered[0].children[0].id, 'club')
  assert.equal(filtered[0].children[0].children[0].id, 'premier')
})

test('filterCategoryTree returns the original tree for an empty term', () => {
  assert.equal(filterCategoryTree(tree, '   '), tree)
})

test('collectExpandableIds marks nodes that have children', () => {
  assert.deepEqual(collectExpandableIds(tree), { 1: true, 2: true })
})
