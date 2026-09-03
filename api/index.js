let app

try {
  const module = await import('../server/server.js')
  app = module.default
} catch (err) {
  console.error('Failed to load server:', err)
  app = (req, res) => {
    res.writeHead(500, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ message: 'Server initialization failed' }))
  }
}

export default function handler(req, res) {
  return app(req, res)
}
