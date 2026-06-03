const errorHandler = (
  err,
  req,
  res,
  next
) => {
  // Log the error for diagnostics
  try {
    console.error('[ERROR MIDDLEWARE] ', err && err.stack ? err.stack : err);
  } catch (e) {
    // ignore logging failures
  }
  const statusCode =
    err.statusCode || 500;

  return res.status(statusCode).json({
    success: false,
    message:
      err.message ||
      "Internal Server Error",
  });
};

export default errorHandler;