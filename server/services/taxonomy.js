export function buildCategoryIndex(categories = []) {
  const byObjectId = new Map()
  const bySlug = new Map()
  const childrenByParent = new Map()
  const duplicateSlugs = new Set()

  for (const category of categories) {
    const objectId = String(category._id)
    byObjectId.set(objectId, category)

    if (category.id) {
      if (bySlug.has(category.id)) duplicateSlugs.add(category.id)
      else bySlug.set(category.id, category)
    }

    if (category.parent) {
      const parentId = String(category.parent)
      if (!childrenByParent.has(parentId)) childrenByParent.set(parentId, [])
      childrenByParent.get(parentId).push(category)
    }
  }

  return {
    categories,
    byObjectId,
    bySlug,
    childrenByParent,
    duplicateSlugs: [...duplicateSlugs],
  }
}

export function findCategory(index, reference) {
  if (reference === null || reference === undefined) return null
  const key = typeof reference === 'object' && reference._id
    ? String(reference._id)
    : String(reference).trim()
  if (!key) return null
  return index.bySlug.get(key) || index.byObjectId.get(key) || null
}

export function resolveCategoryPath(index, reference) {
  const category = findCategory(index, reference)
  if (!category) return { ok: false, reason: 'not-found' }

  const ancestors = []
  const seen = new Set()
  let current = category

  while (current) {
    const key = String(current._id)
    if (seen.has(key)) return { ok: false, reason: 'cycle', category }
    seen.add(key)
    ancestors.unshift(current)

    if (!current.parent) break
    const parentId = String(current.parent)
    const parent = index.byObjectId.get(parentId)
    if (!parent) {
      return { ok: false, reason: 'missing-parent', category, missingParentId: parentId }
    }
    current = parent
  }

  const lineage = ancestors.slice(0, -1)

  return {
    ok: true,
    category,
    ancestors: lineage,
    path: ancestors.map((item) => item.id),
    storedPath: lineage.length
      ? `/${lineage.map((item) => String(item._id)).join('/')}/`
      : '/',
    level: lineage.length,
  }
}

export function getDescendants(index, reference) {
  const root = findCategory(index, reference)
  if (!root) return []

  const seen = new Set([String(root._id)])
  const queue = [root]
  const descendants = []

  while (queue.length) {
    const current = queue.shift()
    const children = index.childrenByParent.get(String(current._id)) || []

    for (const child of children) {
      const key = String(child._id)
      if (seen.has(key)) continue
      seen.add(key)
      descendants.push(child)
      queue.push(child)
    }
  }

  return descendants
}

export function getCategoryFamily(index, reference) {
  const resolved = resolveCategoryPath(index, reference)
  if (!resolved.ok) return { ...resolved, family: [], references: [] }

  const family = [resolved.category, ...getDescendants(index, resolved.category)]
  const references = [...new Set(family.flatMap((category) => [category.id, String(category._id)]))]

  return { ...resolved, family, references }
}

export function sameStringArray(left = [], right = []) {
  return left.length === right.length && left.every((value, index) => value === right[index])
}
