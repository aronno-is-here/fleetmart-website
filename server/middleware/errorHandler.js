export const errorHandler = (err, req, res, _next) => {
  console.error(err.stack)
  const status = err.statusCode || 500
  res.status(status).json({
    message: err.message || 'Server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  })
}
