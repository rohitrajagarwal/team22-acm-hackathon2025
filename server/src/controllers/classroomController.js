const { google } = require('googleapis');

/**
 * Get all courses for a user with their role in each course
 * Returns both teacher and student courses separately
 */
exports.getUserCoursesWithRoles = async (req, res) => {
  const { access_token } = req.body;

  if (!access_token) {
    return res.status(400).json({ error: 'access_token not provided' });
  }

  try {
    const oauth2Client = new (require('google-auth-library').OAuth2Client)();
    oauth2Client.setCredentials({ access_token });

    const classroom = google.classroom({ version: 'v1', auth: oauth2Client });

    // Fetch teacher courses
    let teacherCourses = [];
    try {
      const teacherRes = await classroom.courses.list({ teacherId: 'me' });
      teacherCourses = (teacherRes.data.courses || []).map(course => ({
        courseId: course.id,
        courseName: course.name,
        courseState: course.courseState,
        role: 'teacher',
        description: course.description,
        creationTime: course.creationTime
      }));
    } catch (error) {
      if (error.code !== 403) {
        console.error('Error fetching teacher courses:', error);
      }
    }

    // Fetch student courses
    let studentCourses = [];
    try {
      const studentRes = await classroom.courses.list({ studentId: 'me' });
      studentCourses = (studentRes.data.courses || []).map(course => ({
        courseId: course.id,
        courseName: course.name,
        courseState: course.courseState,
        role: 'student',
        description: course.description,
        creationTime: course.creationTime
      }));
    } catch (error) {
      if (error.code !== 403) {
        console.error('Error fetching student courses:', error);
      }
    }

    // Combine all courses
    const allCourses = [...teacherCourses, ...studentCourses];

    res.json({
      success: true,
      totalCourses: allCourses.length,
      teacherCourses: teacherCourses,
      studentCourses: studentCourses,
      allCourses: allCourses,
      summary: {
        teacherCoursesCount: teacherCourses.length,
        studentCoursesCount: studentCourses.length
      }
    });

  } catch (error) {
    console.error('Error getting user courses with roles:', error);
    res.status(500).json({ error: 'Failed to fetch courses', details: error.message });
  }
};

/**
 * Get a user's role in a specific course
 */
exports.getUserRoleInCourse = async (req, res) => {
  const { access_token, courseId } = req.body;

  if (!access_token || !courseId) {
    return res.status(400).json({ error: 'access_token and courseId required' });
  }

  try {
    const oauth2Client = new (require('google-auth-library').OAuth2Client)();
    oauth2Client.setCredentials({ access_token });

    const classroom = google.classroom({ version: 'v1', auth: oauth2Client });

    let userRole = null;
    let courseDetails = null;

    // Check if user is a teacher in this course
    try {
      const courseRes = await classroom.courses.get({ id: courseId });
      courseDetails = courseRes.data;

      // If we can get the course as teacherId: 'me', user is a teacher
      const teacherRes = await classroom.courses.list({ teacherId: 'me' });
      const isTeacher = teacherRes.data.courses?.some(c => c.id === courseId);
      
      if (isTeacher) {
        userRole = 'teacher';
      }
    } catch (error) {
      console.log('Not a teacher in this course');
    }

    // Check if user is a student in this course
    if (!userRole) {
      try {
        const studentRes = await classroom.courses.list({ studentId: 'me' });
        const isStudent = studentRes.data.courses?.some(c => c.id === courseId);
        
        if (isStudent) {
          userRole = 'student';
        }
      } catch (error) {
        console.log('Not a student in this course');
      }
    }

    if (!userRole) {
      return res.status(403).json({ error: 'User is not enrolled in this course' });
    }

    res.json({
      success: true,
      courseId: courseId,
      courseName: courseDetails?.name,
      userRole: userRole
    });

  } catch (error) {
    console.error('Error getting user role in course:', error);
    res.status(500).json({ error: 'Failed to determine role', details: error.message });
  }
};