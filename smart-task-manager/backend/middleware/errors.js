export function notFound(_req, res) {
  res.status(404).json({ error: { message: 'Endpoint not found.' } });
}
export function errorHandler(err, _req, res, _next) {
  if (err.name === 'ZodError')
    return res.status(400).json({
      error: {
        message: 'Please check the submitted values.',
        fields: err.issues.map((i) => ({ field: i.path.join('.'), message: i.message })),
      },
    });
  if (err.code === 11000)
    return res
      .status(409)
      .json({ error: { message: 'An account with this email already exists.' } });
  if (err.name === 'CastError' || err.name === 'ValidationError')
    return res.status(400).json({ error: { message: 'Invalid data.' } });
  const status = err.status || 500;
  if (status >= 500) console.error('Request failed:', err.name);
  res.status(status).json({
    error: { message: status >= 500 ? 'Something went wrong. Please try again.' : err.message },
  });
}
