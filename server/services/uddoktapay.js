import crypto from 'crypto'
import axios from 'axios'

const DEFAULT_BASE_URL = 'https://sandbox.uddoktapay.com'

const normalizeBaseUrl = () => {
  const configured = (process.env.UDDOKTAPAY_BASE_URL || DEFAULT_BASE_URL).trim()
  const withoutTrailingSlash = configured.replace(/\/+$/, '')
  return /\/api$/i.test(withoutTrailingSlash)
    ? withoutTrailingSlash
    : `${withoutTrailingSlash}/api`
}

export const gatewayUrl = (endpoint) => {
  const path = String(endpoint || '').replace(/^\/+/, '')
  return `${normalizeBaseUrl()}/${path}`
}

export const isUddoktaPayConfigured = () => Boolean(process.env.UDDOKTAPAY_API_KEY)

export const uddoktapayRequest = async (endpoint, body) => {
  const response = await axios.post(gatewayUrl(endpoint), body, {
    headers: {
      'RT-UDDOKTAPAY-API-KEY': process.env.UDDOKTAPAY_API_KEY || '',
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    timeout: 30000,
  })
  return response.data
}

export const isValidWebhookKey = (incomingKey) => {
  const expectedKey = process.env.UDDOKTAPAY_API_KEY || ''
  if (!expectedKey || typeof incomingKey !== 'string' || incomingKey.length !== expectedKey.length) {
    return false
  }

  return crypto.timingSafeEqual(
    Buffer.from(incomingKey, 'utf8'),
    Buffer.from(expectedKey, 'utf8'),
  )
}
