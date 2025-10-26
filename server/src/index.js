const dotenv = require('dotenv');

// Load environment variables BEFORE importing other modules
dotenv.config();

const app = require('./app');

const PORT = process.env.PORT || 5001;

const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

server.on('error', (err) => {
  if (err && err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} already in use. Set PORT env or kill the process using it.`);
    process.exit(1);
  }
  console.error(err);
  process.exit(1);
});
