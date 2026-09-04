import nodemailer from 'nodemailer'

const escapeHtml = (str) => String(str || '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#039;')

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

export const sendEmail = async (to, subject, html) => {
  const t = getTransporter()
  if (!t) {
    console.log(`[EMAIL STUB] To: ${to} | Subject: ${subject}`)
    return true
  }
  try {
    await t.sendMail({
      from: process.env.SMTP_FROM || 'FleetMart <noreply@fleetmart.com>',
      to,
      subject,
      html,
    })
    return true
  } catch (err) {
    console.error(`[EMAIL ERROR] To: ${to} | Subject: ${subject} | Error: ${err.message}`)
    return false
  }
}

export const sendPlainText = async (to, subject, text) => {
  const t = getTransporter()
  if (!t) {
    console.log(`[EMAIL STUB] To: ${to} | Subject: ${subject}`)
    return true
  }
  try {
    await t.sendMail({
      from: process.env.SMTP_FROM || 'FleetMart <noreply@fleetmart.com>',
      to,
      subject,
      text,
    })
    return true
  } catch (err) {
    console.error(`[EMAIL ERROR] To: ${to} | Subject: ${subject} | Error: ${err.message}`)
    return false
  }
}

const SITE_URL = 'https://fleetmartbd.vercel.app'
const SUPPORT_EMAIL = 'support@fleetmart.com'
const SUPPORT_PHONE = '09612-FLEET'

export const fmt = (n) => `৳${Number(n).toLocaleString()}`

export const buildOrderReceiptEmail = (order) => {
  const customerName = order.user?.name || order.guestName || 'Customer'
  const customerEmail = order.user?.email || order.guestEmail || ''
  const orderId = order.orderId
  const orderDate = new Date(order.createdAt).toLocaleDateString('en-BD', { year: 'numeric', month: 'long', day: 'numeric' })

  const itemsHtml = order.items.map(item => `
    <tr>
      <td style="padding:10px 12px;border-bottom:1px solid #222;color:#ccc;font-size:14px;">
        ${escapeHtml(item.name)}${item.size ? ` (${escapeHtml(item.size)})` : ''}${item.customization?.name ? ` — ${escapeHtml(item.customization.name)} #${escapeHtml(item.customization.number)}` : ''}
      </td>
      <td style="padding:10px 12px;border-bottom:1px solid #222;color:#999;font-size:14px;text-align:center;">${item.qty}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #222;color:#ccc;font-size:14px;text-align:right;">${fmt(item.price * item.qty)}</td>
    </tr>
  `).join('')

  const remainingHtml = order.remainingAmount > 0 ? `
    <tr>
      <td style="padding:8px 12px;color:#999;font-size:14px;">Remaining (due on delivery)</td>
      <td style="padding:8px 12px;color:#f97316;font-size:14px;text-align:right;font-weight:600;">${fmt(order.remainingAmount)}</td>
    </tr>
  ` : ''

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:'Segoe UI',system-ui,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:32px 20px;">
    <div style="text-align:center;margin-bottom:32px;">
      <div style="display:inline-block;background:#ccff00;color:#0a0a0a;font-size:20px;font-weight:900;letter-spacing:3px;padding:8px 16px;">FLEETMART</div>
    </div>

    <div style="background:#111;border:1px solid #222;padding:32px;text-align:center;margin-bottom:24px;">
      <div style="font-size:40px;margin-bottom:8px;">✅</div>
      <h1 style="margin:0;color:#fff;font-size:24px;text-transform:uppercase;letter-spacing:2px;">Order Confirmed</h1>
      <p style="margin:8px 0 0;color:#999;font-size:14px;">Thank you, ${escapeHtml(customerName)}! Your order has been placed successfully.</p>
    </div>

    <div style="background:#111;border:1px solid #222;padding:24px;margin-bottom:24px;">
      <table style="width:100%;border-collapse:collapse;">
        <tr>
          <td style="padding:4px 12px;color:#999;font-size:13px;">Order ID</td>
          <td style="padding:4px 12px;color:#ccff00;font-size:13px;text-align:right;font-weight:700;">#${orderId}</td>
        </tr>
        <tr>
          <td style="padding:4px 12px;color:#999;font-size:13px;">Order Date</td>
          <td style="padding:4px 12px;color:#ccc;font-size:13px;text-align:right;">${orderDate}</td>
        </tr>
        <tr>
          <td style="padding:4px 12px;color:#999;font-size:13px;">Payment Method</td>
          <td style="padding:4px 12px;color:#ccc;font-size:13px;text-align:right;text-transform:uppercase;">${order.paymentMethod}</td>
        </tr>
        <tr>
          <td style="padding:4px 12px;color:#999;font-size:13px;">Payment Type</td>
          <td style="padding:4px 12px;color:#ccc;font-size:13px;text-align:right;text-transform:capitalize;">${order.paymentType} Payment</td>
        </tr>
        <tr>
          <td style="padding:4px 12px;color:#999;font-size:13px;">Payment Status</td>
          <td style="padding:4px 12px;color:${order.paymentStatus === 'paid' ? '#22c55e' : order.paymentStatus === 'partial' ? '#f97316' : order.paymentStatus === 'refunded' ? '#22c55e' : '#eab308'};font-size:13px;text-align:right;text-transform:uppercase;font-weight:600;">${order.paymentStatus}</td>
        </tr>
        <tr>
          <td style="padding:4px 12px;color:#999;font-size:13px;">Order Status</td>
          <td style="padding:4px 12px;color:#ccc;font-size:13px;text-align:right;text-transform:capitalize;">${order.orderStatus}</td>
        </tr>
      </table>
    </div>

    <div style="background:#111;border:1px solid #222;padding:24px;margin-bottom:24px;">
      <h2 style="margin:0 0 12px;color:#fff;font-size:14px;text-transform:uppercase;letter-spacing:2px;">Items Ordered</h2>
      <table style="width:100%;border-collapse:collapse;">
        <thead>
          <tr>
            <th style="padding:8px 12px;border-bottom:2px solid #333;color:#999;font-size:11px;text-transform:uppercase;letter-spacing:1px;text-align:left;">Product</th>
            <th style="padding:8px 12px;border-bottom:2px solid #333;color:#999;font-size:11px;text-transform:uppercase;letter-spacing:1px;text-align:center;">Qty</th>
            <th style="padding:8px 12px;border-bottom:2px solid #333;color:#999;font-size:11px;text-transform:uppercase;letter-spacing:1px;text-align:right;">Price</th>
          </tr>
        </thead>
        <tbody>${itemsHtml}</tbody>
      </table>
    </div>

    <div style="background:#111;border:1px solid #222;padding:24px;margin-bottom:24px;">
      <table style="width:100%;border-collapse:collapse;">
        <tr>
          <td style="padding:4px 12px;color:#999;font-size:14px;">Subtotal</td>
          <td style="padding:4px 12px;color:#ccc;font-size:14px;text-align:right;">${fmt(order.subtotal)}</td>
        </tr>
        ${order.shippingFee > 0 ? `
        <tr>
          <td style="padding:4px 12px;color:#999;font-size:14px;">Shipping</td>
          <td style="padding:4px 12px;color:#ccc;font-size:14px;text-align:right;">${fmt(order.shippingFee)}</td>
        </tr>` : ''}
        ${order.discount > 0 ? `
        <tr>
          <td style="padding:4px 12px;color:#999;font-size:14px;">Discount</td>
          <td style="padding:4px 12px;color:#22c55e;font-size:14px;text-align:right;">-${fmt(order.discount)}</td>
        </tr>` : ''}
        <tr>
          <td style="padding:8px 12px;color:#fff;font-size:16px;font-weight:700;border-top:2px solid #333;">Total</td>
          <td style="padding:8px 12px;color:#ccff00;font-size:16px;text-align:right;font-weight:700;border-top:2px solid #333;">${fmt(order.total)}</td>
        </tr>
        <tr>
          <td style="padding:4px 12px;color:#999;font-size:14px;">Amount Paid</td>
          <td style="padding:4px 12px;color:#22c55e;font-size:14px;text-align:right;font-weight:600;">${fmt(order.amountPaid)}</td>
        </tr>
        ${remainingHtml}
      </table>
    </div>

    ${order.shippingAddress ? `
    <div style="background:#111;border:1px solid #222;padding:24px;margin-bottom:24px;">
      <h2 style="margin:0 0 12px;color:#fff;font-size:14px;text-transform:uppercase;letter-spacing:2px;">Delivery Address</h2>
      <p style="margin:0;color:#ccc;font-size:14px;line-height:1.6;">
        ${order.shippingAddress.name ? `<strong>${escapeHtml(order.shippingAddress.name)}</strong><br>` : ''}
        ${order.shippingAddress.street ? `${escapeHtml(order.shippingAddress.street)}<br>` : ''}
        ${order.shippingAddress.city ? `${escapeHtml(order.shippingAddress.city)}` : ''}${order.shippingAddress.district ? `, ${escapeHtml(order.shippingAddress.district)}` : ''}${order.shippingAddress.zip ? ` ${escapeHtml(order.shippingAddress.zip)}` : ''}
        ${order.shippingAddress.country ? `, ${escapeHtml(order.shippingAddress.country)}` : ''}
        ${order.shippingAddress.phone ? `<br>Phone: ${escapeHtml(order.shippingAddress.phone)}` : ''}
      </p>
    </div>
    ` : ''}

    <div style="background:#111;border:1px solid #ccff00;padding:24px;margin-bottom:24px;text-align:center;">
      <p style="margin:0 0 8px;color:#ccff00;font-size:13px;text-transform:uppercase;letter-spacing:2px;font-weight:600;">Track Your Order</p>
      <a href="${SITE_URL}/account/orders" style="color:#ccff00;font-size:14px;text-decoration:underline;">View Order Status</a>
    </div>

    <div style="text-align:center;padding:24px 0;border-top:1px solid #222;">
      <p style="margin:0 0 4px;color:#999;font-size:12px;">Need help? Contact us</p>
      <p style="margin:0;color:#ccc;font-size:13px;">
        <a href="mailto:${SUPPORT_EMAIL}" style="color:#ccff00;text-decoration:none;">${SUPPORT_EMAIL}</a> · ${SUPPORT_PHONE}
      </p>
      <p style="margin:12px 0 0;color:#666;font-size:11px;">© ${new Date().getFullYear()} FleetMart. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`

  return html
}
