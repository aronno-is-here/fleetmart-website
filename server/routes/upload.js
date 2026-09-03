import { Router } from 'express'
import multer from 'multer'
import { v2 as cloudinary } from 'cloudinary'
import { protect, adminOnly } from '../middleware/auth.js'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_KEY,
  api_secret: process.env.CLOUDINARY_SECRET,
})

const storage = multer.memoryStorage()

const fileFilter = (_req, file, cb) => {
  const allowed = /jpeg|jpg|png|webp|gif/
  const ok = allowed.test(file.mimetype)
  cb(ok ? null : new Error('Only image files allowed'), ok)
}

const upload = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } })

const router = Router()

router.post('/', protect, adminOnly, upload.array('images', 10), async (req, res, next) => {
  try {
    const uploads = await Promise.all(
      req.files.map((file) => {
        return new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            { resource_type: 'image', folder: 'fleetmart' },
            (error, result) => {
              if (error) return reject(error)
              resolve({ url: result.secure_url, alt: file.originalname })
            }
          )
          stream.end(file.buffer)
        })
      })
    )
    res.json({ files: uploads })
  } catch (err) {
    next(err)
  }
})

export default router
