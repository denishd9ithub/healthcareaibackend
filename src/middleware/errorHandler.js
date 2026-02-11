function errorHandler(err, req, res, next) {
  if (err.name === 'ValidationError') {
    return res.status(400).json({ error: err.message, details: err.errors });
  }
  if (err.code === 11000) {
    return res.status(409).json({ error: 'Resource already exists' });
  }
  if (err.name === 'CastError') {
    const path = err.path || err.pathType;
    const value = err.value;
    console.error('CastError:', { path, value, message: err.message });
    return res.status(400).json({
      error: 'Invalid id',
      details: path ? { path, value: String(value) } : undefined,
    });
  }
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ error: 'File too large' });
  }
  if (err.message && err.message.includes('audio')) {
    return res.status(400).json({ error: err.message });
  }
  console.error(err);
  res.status(err.statusCode || 500).json({ error: err.message || 'Internal server error' });
}

module.exports = errorHandler;
