const express = require('express');
const cors = require('cors');
const routes = require('./routes');

const app = express();

app.use(cors());
app.use(express.json());

// Create a reusable connection pool with SSL
const pool = new (require('pg')).Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'highview-db.cyniuwiye9h3.us-east-1.rds.amazonaws.com',
  database: process.env.DB_NAME || 'postgres',
  password: process.env.DB_PASSWORD || 'H1ohvpgpass',
  port: process.env.DB_PORT || 5432,
  ssl: {
    rejectUnauthorized: false, // Allow self-signed certificates (RDS uses this)
  },
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

app.use('/api', routes);

app.get('/', (req, res) => {
  res.json({ message: 'Server is up. Use /api/health' });
});

// POST endpoint to create or update users
app.post('/api/users', async (req, res) => {
  try {
    const { email, firstName, lastName, role, google_id } = req.body;

    console.log('Received POST /api/users with data:', { email, firstName, lastName, role });

    if (!email || !firstName || !lastName || !role) {
      return res.status(400).json({ error: 'Missing required fields: email, firstName, lastName, role' });
    }

    // Check if user exists
    const checkResult = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    if (checkResult.rows.length === 0) {
      // Insert new user
      const insertResult = await pool.query(
        'INSERT INTO users (email, first_name, last_name, role, google_id) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [email, firstName, lastName, role, google_id]
      );
      console.log('User created:', insertResult.rows[0]);
      return res.status(201).json({ message: 'User created successfully', user: insertResult.rows[0], isNewUser: true });
    } else {
      // Update existing user with google_id
      if (google_id) {
        const updateResult = await pool.query(
          'UPDATE users SET google_id = $1 WHERE email = $2 RETURNING *',
          [google_id, email]
        );
        console.log('User updated:', updateResult.rows[0]);
      }
      return res.status(200).json({ message: 'User exists', user: checkResult.rows[0], isNewUser: false });
    }
  } catch (error) {
    console.error('Database error:', error);
    return res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
});

app.post('/api/viewmyregistrations', async (req, res) => {
  try {
    const { email, session_id } = req.body;
    console.log('Received POST /api/viewmyregistrations with data:', { email, session_id });

    if (!email || !session_id) {
      return res.status(400).json({ error: 'Missing required fields: email, session_id' });
    }
    const registrationsResult = await pool.query(
      'SELECT * FROM Student_Attendance WHERE user_id = $1 AND session_id = $2',
      [email, session_id]
    );

    console.log('Registrations found:', registrationsResult.rows.length);
    return res.status(200).json({ registrations: registrationsResult.rows });
    
  } catch (error) {
    console.error('Database error:', error);
    return res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
});

module.exports = app;
