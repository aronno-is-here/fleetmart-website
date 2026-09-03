import { cpSync, mkdirSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')
const src = resolve(root, 'client', 'dist')
const dest = resolve(root, 'public')

mkdirSync(dest, { recursive: true })
cpSync(src, dest, { recursive: true })
console.log('Copied client/dist → public/')
