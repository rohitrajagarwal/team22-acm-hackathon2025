const { OAuth2Client } = require('google-auth-library');
const { google } = require('googleapis');
const jwt = require('jsonwebtoken'); // To create your app's token
const { Pool } = require('pg'); // PostgreSQL client

// --- Database & Google Client Setup ---

// Create a new Postgres client pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

// Initialize the Google OAuth2 client
const oAuth2Client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  'postmessage' // This redirect_uri must match what the client uses
);

// --- Main Handler Function ---

/**
 * Handles the Google OAuth callback.
 * 1. Exchanges the auth code for tokens.
 * 2. Fetches user profile from People API.
 * 3. Finds or creates the user in the database.
 * 4. Determines user role (faculty/student) using the Classroom API workaround.
 * 5. Fetches all courses and syncs them to the DB.
 * 6. Creates a new application JWT and sends it back.
 */
exports.handleGoogleCallback = async (req, res) => {
  const { code } = req.body;

  if (!code) {
    return res.status(400).send('Auth code not provided.');
  }

  try {
    // 1. Exchange Code for Tokens
    const { tokens } = await oAuth2Client.getToken(code);
    oAuth2Client.setCredentials(tokens); // Use these tokens for future API calls

    // 2. Get User Profile from People API
    const people = google.people({ version: 'v1', auth: oAuth2Client });
    const profileRes = await people.people.get({
      resourceName: 'people/me',
      personFields: 'names,emailAddresses,metadata',
    });

    const profile = profileRes.data;
    const google_id = profile.metadata.sources[0].id;
    const email = profile.emailAddresses[0].value;
    const first_name = profile.names[0].givenName;
    const last_name = profile.names[0].familyName;

    // 3. Find or Create User in YOUR Database
    let dbUser = await findOrCreateUser(google_id, email, first_name, last_name);
    const user_id = dbUser.user_id; // Your schema uses email as user_id

    // 4. Determine Role & Get Courses (The Workaround)
    const classroom = google.classroom({ version: 'v1', auth: oAuth2Client });
    let userRole = 'student'; // Default to Student
    let coursesResponse;

    try {
      // Try to list courses as a TEACHER
      coursesResponse = await classroom.courses.list({ teacherId: 'me' });
      userRole = 'faculty'; // If this succeeds, they are faculty
    } catch (error) {
      if (error.code === 403) {
        // If 403, they are a STUDENT
        userRole = 'student';
        coursesResponse = await classroom.courses.list({ studentId: 'me' });
      } else {
        throw error; // A different, unexpected error occurred
      }
    }

    // 5. Update User Role in DB
    await pool.query('UPDATE Users SET role = $1 WHERE user_id = $2', [userRole, user_id]);
    dbUser.role = userRole;

    // 6. Process Courses and Update Other Tables
    const courses = coursesResponse.data.courses || [];
    for (const course of courses) {
      // Run in parallel
      await processCourse(course, user_id);
    }

    // 7. Create YOUR App's JWT
    const appToken = jwt.sign(
      { userId: user_id, role: userRole, googleId: google_id },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    // 8. Send Token and User Info to Client
    res.json({
      token: appToken,
      user: {
        id: user_id,
        name: `${first_name} ${last_name}`,
        email: email,
        role: userRole
      }
    });

  } catch (error) {
    console.error('Error during Google auth callback:', error);
    res.status(500).send('Authentication failed.');
  }
};

// --- Helper Functions ---

/**
 * Finds a user by their email (user_id). If they don't exist, creates them.
 * Updates their Google ID and name if they do exist.
 */
async function findOrCreateUser(google_id, email, first_name, last_name) {
  const { rows } = await pool.query('SELECT * FROM Users WHERE user_id = $1', [email]);

  if (rows.length > 0) {
    // User exists, update their info
    await pool.query(
      'UPDATE Users SET google_id = $1, first_name = $2, last_name = $3 WHERE user_id = $4',
      [google_id, first_name, last_name, email]
    );
    return rows[0];
  } else {
    // User doesn't exist, create them
    const { rows: newRows } = await pool.query(
      'INSERT INTO Users (user_id, google_id, first_name, last_name) VALUES ($1, $2, $3, $4) RETURNING *',
      [email, google_id, first_name, last_name]
    );
    return newRows[0];
  }
}

/**
 * Syncs a single Google Classroom course to your Companies, Sessions,
 * and Student_Attendance tables.
 */
async function processCourse(course, user_id) {
  // 1. Find or Create Company
  const company_name = parseCompanyFromDescription(course.description);
  const { rows: companyRows } = await pool.query(
    // 'ON CONFLICT' atomically inserts or does nothing if the company exists
    'INSERT INTO Companies (company_name) VALUES ($1) ON CONFLICT (company_name) DO UPDATE SET company_name = EXCLUDED.company_name RETURNING company_id',
    [company_name || 'Unspecified'] // Default if no company is found
  );
  const company_id = companyRows[0].company_id;

  // 2. Find or Create Session
  const session_name = course.name;
  // NOTE: Google Classroom 'Course' does not have a "hosted date".
  // We will use 'creationTime' as a substitute, as planned.
  const session_date = course.creationTime; 

  // Try to insert the session. If it conflicts on name, do nothing.
  const { rows: sessionRows } = await pool.query(
    'INSERT INTO Sessions (session_name, session_date, company_id) VALUES ($1, $2, $3) ON CONFLICT (session_name) DO NOTHING RETURNING session_id',
    [session_name, session_date, company_id]
  );
  
  let session_id;
  if (sessionRows.length > 0) {
    // We inserted a new row, so we have the ID.
    session_id = sessionRows[0].session_id;
  } else {
    // The session already existed. We need to fetch its ID.
    const { rows } = await pool.query('SELECT session_id FROM Sessions WHERE session_name = $1', [session_name]);
    session_id = rows[0].session_id;
  }

  // 3. Find or Create Student Attendance
  const attendance_status = mapCourseStateToStatus(course.courseState);
  await pool.query(
    // Creates the attendance record. If it already exists, does nothing.
    'INSERT INTO Student_Attendance (user_id, session_id, attendance_status) VALUES ($1, $2, $3) ON CONFLICT (user_id, session_id) DO NOTHING',
    [user_id, session_id, attendance_status]
  );
}

/**
 * Tries to find "Company: [Company Name]" in the course description.
 */
function parseCompanyFromDescription(description) {
  if (!description) return null;
  const match = description.match(/Company:\s*(.*)/i);
  return match ? match[1].trim() : null;
}

/**
 * Maps the Google Classroom course state to your attendance status.
 */
function mapCourseStateToStatus(courseState) {
  switch (courseState) {
    case 'ACTIVE':
      return 'registered';
    case 'PROVISIONED':
    case 'DECLINED':
      return 'invited';
    default:
      return 'unknown';
  }
}
