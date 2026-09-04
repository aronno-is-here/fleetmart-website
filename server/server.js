import dotenv from 'dotenv'
dotenv.config()

import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import compression from 'compression'
import rateLimit from 'express-rate-limit'
import mongoSanitize from 'express-mongo-sanitize'
import cookieParser from 'cookie-parser'
import morgan from 'morgan'
import path from 'path'
import { fileURLToPath } from 'url'
import connectDB from './config/db.js'
import { errorHandler } from './middleware/errorHandler.js'

import authRoutes from './routes/auth.js'
import productRoutes from './routes/products.js'
import categoryRoutes from './routes/categories.js'
import orderRoutes from './routes/orders.js'
import reviewRoutes from './routes/reviews.js'
import couponRoutes from './routes/coupons.js'
import adminRoutes from './routes/admin.js'
import analyticsRoutes from './routes/analytics.js'
import uploadRoutes from './routes/upload.js'
import paymentRoutes from './routes/payment.js'
import bannerRoutes from './routes/banners.js'
import brandRoutes from './routes/brands.js'
import teamRoutes from './routes/teams.js'
import ensureDemoProduct from './startup/ensureDemoProduct.js'
import ensureTaxonomy from './startup/ensureTaxonomy.js'

// Validate required env vars
const requiredEnv = ['JWT_SECRET', 'JWT_REFRESH_SECRET', 'MONGODB_URI']
for (const key of requiredEnv) {
  if (!process.env[key]) {
    console.error(`Missing required env var: ${key}`)
    if (!process.env.VERCEL) process.exit(1)
  }
}

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()
const PORT = process.env.PORT || 5000

const corsOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',').map((o) => o.trim())
  : process.env.NODE_ENV === 'development'
    ? true
    : ['http://localhost:5173', 'http://localhost:3000']

// Security headers
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
}))

// Compression
app.use(compression())

// CORS
app.use(cors({
  origin: corsOrigins,
  credentials: true,
}))

// Rate limiting
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { message: 'Too many attempts, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
})

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { message: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
})

// Body parsing
app.use(express.json({ limit: '10mb' }))
app.use(cookieParser())

// NoSQL injection prevention
app.use(mongoSanitize())

// Static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), { maxAge: '7d' }))

// Logging
if (process.env.NODE_ENV === 'development') app.use(morgan('dev'))

// Vercel: connect DB lazily before routes
if (process.env.VERCEL) {
  let dbConnected = false
  app.use(async (_req, _res, next) => {
    if (!dbConnected) {
      try {
        await connectDB()
        dbConnected = true
        ensureDemoProduct()
        ensureTaxonomy()
      } catch (err) {
        console.error('Database connection failed:', err.message)
      }
    }
    next()
  })
}

// API rate limiter
app.use('/api', apiLimiter)

// Routes
app.use('/api/auth', authLimiter, authRoutes)
app.use('/api/products', productRoutes)
app.use('/api/categories', categoryRoutes)
app.use('/api/orders', orderRoutes)
app.use('/api/reviews', reviewRoutes)
app.use('/api/coupons', couponRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/admin', analyticsRoutes)
app.use('/api/upload', uploadRoutes)
app.use('/api/payment', paymentRoutes)
app.use('/api/banners', bannerRoutes)
app.use('/api/brands', brandRoutes)
app.use('/api/teams', teamRoutes)

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }))

// Serve React build in production (non-Vercel only)
if (process.env.NODE_ENV === 'production' && !process.env.VERCEL) {
  const clientDist = path.join(__dirname, '..', 'client', 'dist')
  app.use(express.static(clientDist, { maxAge: '1y', immutable: true }))
  app.get('*', (_req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'))
  })
}

// Error handler
app.use(errorHandler)

// Process error handlers
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection:', reason)
})

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err)
})

// Start
if (!process.env.VERCEL) {
  connectDB().then(() => {
    ensureDemoProduct()
    ensureTaxonomy()
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`))
  })
}

export default app
