function sendError(res, error) {
  res.status(error.statusCode || 500).json({
    ok: false,
    message: error.message,
  });
}

module.exports = { sendError };
