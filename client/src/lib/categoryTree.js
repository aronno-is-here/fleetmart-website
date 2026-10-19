export function flattenCategoryTree(tree = [], depth = 0) {
  const flat = []
  for (const node of tree) {
    flat.push({ ...node, depth })
    if (node.children?.length) {
      flat.push(...flattenCategoryTree(node.children, depth + 1))
    }
  }
  return flat
}

export function findCategoryPath(tree = [], id) {
  if (!id) return []
  for (const node of tree) {
    if (node.id === id) return [node]
    const childPath = findCategoryPath(node.children || [], id)
    if (childPath.length) return [node, ...childPath]
  }
  return []
}

export function collectDescendantIds(tree = [], id) {
  const path = findCategoryPath(tree, id)
  if (!path.length) return []

  const leaf = path[path.length - 1]
  const ids = []
  const walk = (nodes) => {
    for (const node of nodes) {
      ids.push(node.id)
      if (node.children?.length) walk(node.children)
    }
  }
  walk(leaf.children || [])
  return ids
}

export function collectExpandableIds(tree = []) {
  const expanded = {}
  const walk = (nodes) => {
    for (const node of nodes) {
      if (node.children?.length) {
        expanded[node._id] = true
        walk(node.children)
      }
    }
  }
  walk(tree)
  return expanded
}

export function filterCategoryTree(tree = [], term = '') {
  const query = String(term).trim().toLowerCase()
  if (!query) return tree

  const matches = (node) =>
    String(node.id || '').toLowerCase().includes(query) ||
    String(node.name || '').toLowerCase().includes(query)

  const prune = (nodes) => {
    const result = []
    for (const node of nodes) {
      const children = prune(node.children || [])
      if (matches(node) || children.length) {
        result.push({ ...node, children })
      }
    }
    return result
  }

  return prune(tree)
}
