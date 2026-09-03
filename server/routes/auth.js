import { Router } from 'express'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import { body, validationResult } from 'express-validator'
import nodemailer from 'nodemailer'
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

const generateCode = () => String(Math.floor(100000 + Math.random() * 900000))

let transporter = null
const getTransporter = () => {
  if (transporter) return transporter
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })
  }
  return transporter
}

const sendEmail = async (to, subject, body) => {
  const t = getTransporter()
  if (!t) {
    console.log(`[EMAIL STUB] To: ${to} | Subject: ${subject}`)
    return true
  }
  await t.sendMail({
    from: process.env.SMTP_FROM || 'FleetMart <noreply@fleetmart.com>',
    to,
    subject,
    text: body,
  })
  return true
}

const sendSMS = async (phone, message) => {
  console.log(`[SMS STUB] To: ${phone} | Message: ${message}`)
  return true
}

const validate = (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    res.status(400).json({ message: errors.array()[0].msg })
    return false
  }
  return true
}

// POST /api/auth/register
router.post('/register', [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
], async (req, res, next) => {
  try {
    if (!validate(req, res)) return

    const { name, email, password, phone } = req.body

    const exists = await User.findOne({ email })
    if (exists) return res.status(400).json({ message: 'Email already registered' })

    const user = await User.create({ name, email, password, phone: phone || '' })
    const token = generateToken(user._id)
    const refresh = generateRefreshToken(user._id)
    setCookies(res, token, refresh)
    res.status(201).json({ user, token })
  } catch (err) { next(err) }
})

// POST /api/auth/login
router.post('/login', [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
], async (req, res, next) => {
  try {
    if (!validate(req, res)) return

    const { email, password } = req.body

    const user = await User.findOne({ email }).select('+password')
    if (!user) {
      return res.status(401).json({ message: 'No account found with this email. Please register first.' })
    }
    if (user.role === 'admin') {
      return res.status(403).json({ message: 'Admin accounts cannot login here. Use the Admin Panel.' })
    }
    if (!(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Wrong password. Please try again.' })
    }

    const token = generateToken(user._id)
    const refresh = generateRefreshToken(user._id)
    setCookies(res, token, refresh)
    res.json({ user, token })
  } catch (err) { next(err) }
})

// POST /api/auth/google
router.post('/google', [
  body('credential').notEmpty().withMessage('Google credential is required'),
], async (req, res, next) => {
  try {
    if (!validate(req, res)) return

    const { credential } = req.body

    let payload
    try {
      const parts = credential.split('.')
      if (parts.length === 3) {
        payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString())
      } else {
        return res.status(400).json({ message: 'Invalid Google token format' })
      }
    } catch {
      return res.status(400).json({ message: 'Invalid Google token' })
    }

    const { sub: googleId, email, name, picture } = payload
    if (!email) {
      return res.status(400).json({ message: 'Google account must have an email' })
    }

    let user = await User.findOne({ $or: [{ googleId }, { email }] })

    if (user) {
      if (!user.googleId) {
        user.googleId = googleId
        if (picture && !user.avatar) user.avatar = picture
        await user.save()
      }
    } else {
      user = await User.create({
        name: name || email.split('@')[0],
        email,
        googleId,
        avatar: picture || '',
        password: crypto.randomBytes(32).toString('hex'),
      })
    }

    const token = generateToken(user._id)
    const refresh = generateRefreshToken(user._id)
    setCookies(res, token, refresh)
    res.json({ user, token })
  } catch (err) { next(err) }
})

// POST /api/auth/apple
router.post('/apple', [
  body('identityToken').notEmpty().withMessage('Apple identity token is required'),
], async (req, res, next) => {
  try {
    if (!validate(req, res)) return

    const { identityToken, user: appleUser } = req.body

    let payload
    try {
      const parts = identityToken.split('.')
      if (parts.length === 3) {
        payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString())
      } else {
        return res.status(400).json({ message: 'Invalid Apple token format' })
      }
    } catch {
      return res.status(400).json({ message: 'Invalid Apple token' })
    }

    const { sub: appleId, email } = payload
    const userEmail = email || appleUser?.email
    const userName = appleUser?.name ? `${appleUser.name.firstName || ''} ${appleUser.name.lastName || ''}`.trim() : ''

    if (!userEmail && !appleId) {
      return res.status(400).json({ message: 'Unable to identify Apple user' })
    }

    let user = await User.findOne({ $or: [{ appleId }, ...(userEmail ? [{ email: userEmail }] : [])] })

    if (user) {
      if (!user.appleId) {
        user.appleId = appleId
        await user.save()
      }
    } else {
      if (!userEmail) {
        return res.status(400).json({ message: 'Email is required for first-time Apple sign-in' })
      }
      user = await User.create({
        name: userName || userEmail.split('@')[0],
        email: userEmail,
        appleId,
        password: crypto.randomBytes(32).toString('hex'),
      })
    }

    const token = generateToken(user._id)
    const refresh = generateRefreshToken(user._id)
    setCookies(res, token, refresh)
    res.json({ user, token })
  } catch (err) { next(err) }
})

// POST /api/auth/forgot-password
router.post('/forgot-password', [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('method').isIn(['email', 'sms']).withMessage('Method must be email or sms'),
], async (req, res, next) => {
  try {
    if (!validate(req, res)) return

    const { email, method } = req.body

    const user = await User.findOne({ email })
    if (!user) {
      return res.status(404).json({ message: 'No account found with this email' })
    }

    if (user.forgotPasswordAttempts >= 5) {
      const timeSinceLastAttempt = Date.now() - new Date(user.forgotPasswordLastAttempt).getTime()
      if (timeSinceLastAttempt < 60 * 60 * 1000) {
        return res.status(429).json({ message: 'Too many attempts. Please try again in 1 hour.' })
      }
      user.forgotPasswordAttempts = 0
    }

    const code = generateCode()
    user.verificationCode = code
    user.verificationExpiry = new Date(Date.now() + 10 * 60 * 1000)
    user.verificationMethod = method
    user.forgotPasswordAttempts = (user.forgotPasswordAttempts || 0) + 1
    user.forgotPasswordLastAttempt = new Date()
    await user.save()

    if (method === 'email') {
      await sendEmail(user.email, 'FleetMart Password Reset', `Your verification code is: ${code}. It expires in 10 minutes.`)
      res.json({ message: `Verification code sent to ${user.email}` })
    } else {
      if (!user.phone) {
        return res.status(400).json({ message: 'No phone number on file. Please use email verification or update your profile.' })
      }
      await sendSMS(user.phone, `Your FleetMart verification code is: ${code}. It expires in 10 minutes.`)
      res.json({ message: `Verification code sent to ${user.phone}` })
    }
  } catch (err) { next(err) }
})

// POST /api/auth/verify-code
router.post('/verify-code', [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('code').notEmpty().withMessage('Verification code is required'),
], async (req, res, next) => {
  try {
    if (!validate(req, res)) return

    const { email, code } = req.body

    const user = await User.findOne({ email })
    if (!user) {
      return res.status(404).json({ message: 'No account found with this email' })
    }

    if (!user.verificationCode || !user.verificationExpiry) {
      return res.status(400).json({ message: 'No verification code pending. Request a new one.' })
    }

    if (user.verificationExpiry < new Date()) {
      return res.status(400).json({ message: 'Verification code has expired. Request a new one.' })
    }

    if (user.verificationCode !== code) {
      return res.status(400).json({ message: 'Invalid verification code' })
    }

    const resetToken = crypto.randomBytes(32).toString('hex')
    user.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex')
    user.passwordResetExpiry = new Date(Date.now() + 15 * 60 * 1000)
    user.verificationCode = null
    user.verificationExpiry = null
    await user.save()

    res.json({ message: 'Code verified successfully', resetToken })
  } catch (err) { next(err) }
})

// POST /api/auth/reset-password
router.post('/reset-password', [
  body('resetToken').notEmpty().withMessage('Reset token is required'),
  body('newPassword').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
], async (req, res, next) => {
  try {
    if (!validate(req, res)) return

    const { resetToken, newPassword } = req.body

    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex')
    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpiry: { $gt: new Date() },
    }).select('+password')

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired reset token' })
    }

    user.password = newPassword
    user.passwordResetToken = null
    user.passwordResetExpiry = null
    user.forgotPasswordAttempts = 0
    await user.save()

    const token = generateToken(user._id)
    const refresh = generateRefreshToken(user._id)
    setCookies(res, token, refresh)
    res.json({ message: 'Password reset successful', user, token })
  } catch (err) { next(err) }
})

// POST /api/auth/refresh
router.post('/refresh', async (req, res, next) => {
  try {
    const refreshToken = req.cookies?.refreshToken
    if (!refreshToken) return res.status(401).json({ message: 'No refresh token' })

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET)
    const user = await User.findById(decoded.id)
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
router.put('/profile', protect, [
  body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
  body('phone').optional().trim(),
], async (req, res, next) => {
  try {
    if (!validate(req, res)) return
    const { name, phone, avatar } = req.body
    const user = await User.findById(req.user._id)
    if (name) user.name = name
    if (phone !== undefined) user.phone = phone
    if (avatar !== undefined) user.avatar = avatar
    await user.save()
    res.json({ user })
  } catch (err) { next(err) }
})

// PUT /api/auth/password
router.put('/password', protect, [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
], async (req, res, next) => {
  try {
    if (!validate(req, res)) return
    const { currentPassword, newPassword } = req.body
    const user = await User.findById(req.user._id).select('+password')
    if (!(await user.comparePassword(currentPassword))) {
      return res.status(400).json({ message: 'Current password is incorrect' })
    }
    user.password = newPassword
    await user.save()
    res.json({ message: 'Password updated' })
  } catch (err) { next(err) }
})

// PUT /api/auth/addresses
router.put('/addresses', protect, [
  body('addresses').isArray().withMessage('Addresses must be an array'),
], async (req, res, next) => {
  try {
    if (!validate(req, res)) return
    const { addresses } = req.body
    const user = await User.findById(req.user._id)
    user.addresses = addresses
    await user.save()
    res.json({ user })
  } catch (err) { next(err) }
})

// PUT /api/auth/billing
router.put('/billing', protect, [
  body('billing').isObject().withMessage('Billing info is required'),
], async (req, res, next) => {
  try {
    if (!validate(req, res)) return
    const { billing } = req.body
    const user = await User.findById(req.user._id)
    user.billing = { ...user.billing, ...billing }
    await user.save()
    res.json({ user })
  } catch (err) { next(err) }
})

export default router
