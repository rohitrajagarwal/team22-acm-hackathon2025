const express = require('express');
const router = express.Router();
const classroomController = require('../controllers/classroomController');

// Get all courses with roles
router.post('/user-courses-with-roles', classroomController.getUserCoursesWithRoles);

// Get user role in a specific course
router.post('/user-role-in-course', classroomController.getUserRoleInCourse);

module.exports = router;