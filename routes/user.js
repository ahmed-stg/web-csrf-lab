const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const auth = require('../middleware/auth');

// ============================================================================
// SECURE ROUTES (JWT via Authorization header + middleware)
// ============================================================================
// Public routes
router.post('/register', userController.addUser);
router.post('/login', userController.loginUser);

// Protected routes (JWT middleware)
router.get('/profile', auth, userController.getUserDetails);
router.put('/profile', auth, userController.editUser);

// ============================================================================
// VULNERABLE ROUTES (Cookie-based - NO CSRF PROTECTION)
// ============================================================================
// Cookie-based authentication routes
router.post('/cookie-register', userController.cookieRegister);
router.post('/cookie-login', userController.cookieLogin);
router.get('/cookie-profile', userController.cookieGetUserDetails);
router.put('/cookie-profile', userController.cookieEditUser);

// CSRF attack demo endpoints
router.put('/username-jwt', userController.changeUsernameJWT);
router.put('/username-cookie', userController.changeUsernameCookie);

// Logout
router.post('/logout', userController.logoutUser);

module.exports = router;