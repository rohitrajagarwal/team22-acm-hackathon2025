const express = require('express');
const cors = require('cors');
const routes = require('./routes');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api', routes);

app.get('/', (req, res) => {
  res.json({ message: 'Server is up. Use /api/health' });
});


app.get('/api/users', (req, res) => {
  // Connect to PostgreSQL and fetch users
  // 
  const pool = new Pool({
    user: 'postgres',
    host: 'highview-db.cyniuwiye9h3.us-east-1.rds.amazonaws.com',
    database: 'postgres',
    password: 'H1ohvpgpass',
    port: 5432,
  });

  pool.query('SELECT * FROM users where email = $1', [req.query.email] , (error, results) => {
    if (error) {
      console.error('Error fetching users:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
    res.json(results.rows);
    // check if there are any rows returned. if not, store the req json into users table. if yes, update google_id and return 200
    if (results.rows.length === 0) {
      const { email, firstName, lastName, role, google_id } = req.body;
      pool.query('INSERT INTO users (email, first_name, last_name, role, google_id) VALUES ($1, $2, $3, $4, $5)', [email, firstName, lastName, role, google_id], (insertError) => {
        if (insertError) {
          console.error('Error inserting user:', insertError);
          return res.status(500).json({ error: 'Internal Server Error' });
        }
        return res.status(201).json({ message: 'User created successfully' });
      });
    } else {
      const { google_id } = req.body;
      pool.query('UPDATE users SET google_id = $1 WHERE email = $2', [google_id, req.query.email], (updateError) => {
        if (updateError) {
          console.error('Error updating user:', updateError);
          return res.status(500).json({ error: 'Internal Server Error' });
        }
        return res.status(200).json({ message: 'User updated successfully' });
      });
    }
  });
  // close connection
  pool.end();
});


module.exports = app;
