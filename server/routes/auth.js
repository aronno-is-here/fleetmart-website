import { Router } from 'express'
import jwt from 'jsonwebtoken'
import User from '../models/User.js'
import { protect } from '../middleware/auth.js'

const router = Router()

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' })

const generateRefreshToken = (id) =>
  jwt.sign({ id }, process.env.JWT_REFRESH_SECRET, { expiresIn: '30d' })

const setCookies = (res, accessToken, refreshToken) => {
  res.cookie('token', accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  })
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 30 * 24 * 60 * 60 * 1000,
  })
}

// POST /api/auth/register
router.post('/register', async (req, res, next) => {
  try {
    const { name, email, password, phone } = req.body
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email and password are required' })
    }

    const exists = await User.findOne({ email })
    if (exists) return res.status(400).json({ message: 'Email already registered' })

    const user = await User.create({ name, email, password, phone })
    const token = generateToken(user._id)
    const refresh = generateRefreshToken(user._id)
    setCookies(res, token, refresh)
    res.status(201).json({ user, token })
  } catch (err) { next(err) }
})

// POST /api/auth/login
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' })
    }

    const user = await User.findOne({ email })
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password' })
    }

    const token = generateToken(user._id)
    const refresh = generateRefreshToken(user._id)
    setCookies(res, token, refresh)
    res.json({ user, token })
  } catch (err) { next(err) }
})

// POST /api/auth/refresh
router.post('/refresh', async (req, res, next) => {
  try {
    const refreshToken = req.cookies?.refreshToken
    if (!refreshToken) return res.status(401).json({ message: 'No refresh token' })

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET)
    const user = await User.findById(decoded.id).select('-password')
    if (!user) return res.status(401).json({ message: 'User not found' })

    const token = generateToken(user._id)
    const newRefresh = generateRefreshToken(user._id)
    setCookies(res, token, newRefresh)
    res.json({ user, token })
  } catch {
    return res.status(401).json({ message: 'Invalid refresh token' })
  }
})

// POST /api/auth/logout
router.post('/logout', (_req, res) => {
  res.cookie('token', '', { maxAge: 0 })
  res.cookie('refreshToken', '', { maxAge: 0 })
  res.json({ message: 'Logged out' })
})

// GET /api/auth/me
router.get('/me', protect, async (req, res) => {
  res.json({ user: req.user })
})

// PUT /api/auth/profile
router.put('/profile', protect, async (req, res, next) => {
  try {
    const { name, phone, addresses } = req.body
    const user = await User.findById(req.user._id)
    if (name) user.name = name
    if (phone !== undefined) user.phone = phone
    if (addresses) user.addresses = addresses
    await user.save()
    res.json({ user })
  } catch (err) { next(err) }
})

// PUT /api/auth/password
router.put('/password', protect, async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body
    const user = await User.findById(req.user._id)
    if (!(await user.comparePassword(currentPassword))) {
      return res.status(400).json({ message: 'Current password is incorrect' })
    }
    user.password = newPassword
    await user.save()
    res.json({ message: 'Password updated' })
  } catch (err) { next(err) }
})

export default router
