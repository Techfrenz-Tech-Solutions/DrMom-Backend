const validate = (schema) => (req, _res, next) => {
  const result = schema.parse({
    body: req.body,
    query: req.query,
    params: req.params,
  });

  req.validated = result;
  next();
};

module.exports = { validate };
