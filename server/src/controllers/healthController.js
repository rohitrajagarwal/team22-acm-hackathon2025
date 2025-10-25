exports.health = (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
};
