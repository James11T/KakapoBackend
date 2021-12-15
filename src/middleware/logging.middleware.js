const logRequest = async (req, res, next) => {
  let ip = req.headers["x-real-ip"] || req.ip;
  console.log(`${ip} connecting to ${req.url} via ${req.protocol}`);

  return next();
};

export { logRequest };
