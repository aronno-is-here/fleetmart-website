import { Router } from 'express'
import multer from 'multer'
import path from 'path'
import { fileURLToPath } from 'url'
import { protect, adminOnly } from '../middleware/auth.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const uploadDir = path.join(__dirname, '..', 'uploads')

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9)
    const ext = path.extname(file.originalname)
    cb(null, unique + ext)
  },
})

const fileFilter = (_req, file, cb) => {
  const allowed = /jpeg|jpg|png|webp|gif/
  const ok = allowed.test(path.extname(file.originalname).toLowerCase()) && allowed.test(file.mimetype)
  cb(ok ? null : new Error('Only image files allowed'), ok)
}

const upload = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } })

const router = Router()

// POST /api/upload — admin upload images
router.post('/', protect, adminOnly, upload.array('images', 10), (req, res) => {
  const files = req.files.map(f => ({
    url: `/uploads/${f.filename}`,
    alt: f.originalname,
  }))
  res.json({ files })
})

export default router
