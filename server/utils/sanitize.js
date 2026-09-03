export const escapeRegex = (str) => String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

export const escapeHtml = (str) => String(str)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#039;')

export const sanitizeInput = (str, maxLen = 500) => String(str || '').slice(0, maxLen).trim()

export const whitelist = (obj, fields) => {
  const result = {}
  for (const f of fields) {
    if (obj[f] !== undefined) result[f] = obj[f]
  }
  return result
}
