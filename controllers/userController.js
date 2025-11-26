const User = require('../models/User');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'example';

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
};

// Cookie options (VULNERABLE)
const vulnerableCookieOptions = {
  httpOnly: false,    // JavaScript CAN access
  secure: false,      // Works on HTTP
  sameSite: 'lax',    // Some cross-site allowed
  domain: 'localhost', // All localhost ports
  path: '/',
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
};

// ============================================================================
// SECURE ENDPOINTS (JWT via Authorization header)
// ============================================================================

// Add user (register)
exports.addUser = async (req, res) => {
  try {
    const { username, password, birthdate, profile_picture } = req.body;

    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    const user = new User({
      username,
      passwordhash: password,
      birthdate: new Date(birthdate),
      profile_picture
    });

    const token = generateToken(user._id);
    user.jwt_token = token;

    await user.save();

    res.status(201).json({
      message: 'User created successfully',
      token,
      user: {
        id: user._id,
        username: user.username,
        birthdate: user.birthdate,
        profile_picture: user.profile_picture
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Login user (secure - token in response only)
exports.loginUser = async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await User.findOne({ username });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = generateToken(user._id);
    user.jwt_token = token;
    await user.save();

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        username: user.username,
        birthdate: user.birthdate,
        profile_picture: user.profile_picture
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get user details (requires auth middleware)
exports.getUserDetails = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-passwordhash -jwt_token');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      user: {
        id: user._id,
        username: user.username,
        birthdate: user.birthdate,
        profile_picture: user.profile_picture,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Edit user (requires auth middleware)
exports.editUser = async (req, res) => {
  try {
    const { username, password, birthdate, profile_picture } = req.body;
    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (username && username !== user.username) {
      const existingUser = await User.findOne({ username });
      if (existingUser) {
        return res.status(400).json({ error: 'Username already exists' });
      }
      user.username = username;
    }

    if (password) user.passwordhash = password;
    if (birthdate) user.birthdate = new Date(birthdate);
    if (profile_picture !== undefined) user.profile_picture = profile_picture;

    await user.save();

    res.json({
      message: 'User updated successfully',
      user: {
        id: user._id,
        username: user.username,
        birthdate: user.birthdate,
        profile_picture: user.profile_picture
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ============================================================================
// VULNERABLE ENDPOINTS (Cookie-based authentication - NO CSRF PROTECTION)
// ============================================================================

// Cookie-based login (VULNERABLE)
exports.cookieLogin = async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await User.findOne({ username });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = generateToken(user._id);
    user.jwt_token = token;
    await user.save();

    // Set VULNERABLE cookies
    res.cookie('authToken', token, vulnerableCookieOptions);
    res.cookie('userId', user._id.toString(), vulnerableCookieOptions);

    console.log('VULNERABLE LOGIN: Cookies set without CSRF protection');
    console.log('   authToken:', token.substring(0, 20) + '...');
    console.log('   userId:', user._id.toString());

    res.json({
      message: 'Cookie login successful',
      user: {
        id: user._id,
        username: user.username,
        birthdate: user.birthdate,
        profile_picture: user.profile_picture
      },
      token: token
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Cookie-based register (VULNERABLE)
exports.cookieRegister = async (req, res) => {
  try {
    const { username, password, birthdate, profile_picture } = req.body;

    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    const user = new User({
      username,
      passwordhash: password,
      birthdate: new Date(birthdate),
      profile_picture
    });

    const token = generateToken(user._id);
    user.jwt_token = token;
    await user.save();

    // Set VULNERABLE cookies
    res.cookie('authToken', token, vulnerableCookieOptions);
    res.cookie('userId', user._id.toString(), vulnerableCookieOptions);

    console.log('VULNERABLE REGISTER: User created with cookie auth');

    res.status(201).json({
      message: 'User created successfully',
      user: {
        id: user._id,
        username: user.username,
        birthdate: user.birthdate,
        profile_picture: user.profile_picture
      },
      token: token
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get user details via cookie (VULNERABLE)
exports.cookieGetUserDetails = async (req, res) => {
  try {
    // Try to get user ID from cookie first, then from JWT
    let userId = req.cookies.userId;
    
    if (!userId && req.cookies.authToken) {
      try {
        const decoded = jwt.verify(req.cookies.authToken, JWT_SECRET);
        userId = decoded.userId;
      } catch (err) {
        return res.status(401).json({ error: 'Invalid token' });
      }
    }

    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const user = await User.findById(userId).select('-passwordhash -jwt_token');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    console.log('🍪 Profile accessed via cookies');

    res.json({
      user: {
        id: user._id,
        username: user.username,
        birthdate: user.birthdate,
        profile_picture: user.profile_picture,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Edit user via cookie (VULNERABLE)
exports.cookieEditUser = async (req, res) => {
  try {
    const { username, password, birthdate, profile_picture } = req.body;
    
    // Get user ID from cookie
    let userId = req.cookies.userId;
    
    if (!userId && req.cookies.authToken) {
      try {
        const decoded = jwt.verify(req.cookies.authToken, JWT_SECRET);
        userId = decoded.userId;
      } catch (err) {
        return res.status(401).json({ error: 'Invalid token' });
      }
    }

    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (username && username !== user.username) {
      const existingUser = await User.findOne({ username });
      if (existingUser) {
        return res.status(400).json({ error: 'Username already exists' });
      }
      user.username = username;
    }

    if (password) user.passwordhash = password;
    if (birthdate) user.birthdate = new Date(birthdate);
    if (profile_picture !== undefined) user.profile_picture = profile_picture;

    await user.save();

    console.log('COOKIE-BASED CSRF: Profile edited via cookies');
    console.log('   Origin:', req.get('origin'));

    res.json({
      message: 'User updated successfully',
      user: {
        id: user._id,
        username: user.username,
        birthdate: user.birthdate,
        profile_picture: user.profile_picture
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Change username via JWT cookie (VULNERABLE - CSRF DEMO)
exports.changeUsernameJWT = async (req, res) => {
  try {
    const { username } = req.body;
    
    const token = req.cookies.authToken;
    if (!token) {
      return res.status(401).json({ error: 'No auth token cookie found' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    if (username) {
      const existingUser = await User.findOne({ username });
      if (existingUser && existingUser._id.toString() !== user._id.toString()) {
        return res.status(400).json({ error: 'Username already exists' });
      }
      
      const oldUsername = user.username;
      user.username = username;
      await user.save();

      console.log('JWT COOKIE CSRF ATTACK DETECTED!');
      console.log(`   Username changed: "${oldUsername}" → "${username}"`);
      console.log('   Origin:', req.get('origin'));
      console.log('   Cookie token used for authentication');

      res.json({
        message: 'Username updated via JWT cookie',
        user: {
          id: user._id,
          username: user.username
        }
      });
    } else {
      res.status(400).json({ error: 'Username is required' });
    }
  } catch (error) {
    console.log('JWT Cookie auth error:', error.message);
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Change username via direct cookie (VULNERABLE - CSRF DEMO)
exports.changeUsernameCookie = async (req, res) => {
  try {
    const { username } = req.body;
    
    const userId = req.cookies.userId;
    if (!userId) {
      return res.status(401).json({ error: 'No user session found' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(401).json({ error: 'Invalid session' });
    }

    if (username) {
      const existingUser = await User.findOne({ username });
      if (existingUser && existingUser._id.toString() !== user._id.toString()) {
        return res.status(400).json({ error: 'Username already exists' });
      }
      
      const oldUsername = user.username;
      user.username = username;
      await user.save();

      console.log('DIRECT COOKIE CSRF ATTACK DETECTED!');
      console.log(`   Username changed: "${oldUsername}" → "${username}"`);
      console.log('   Origin:', req.get('origin'));
      console.log('   User ID taken directly from cookie (NO VALIDATION!)');

      res.json({
        message: 'Username updated via direct cookie',
        user: {
          id: user._id,
          username: user.username
        }
      });
    } else {
      res.status(400).json({ error: 'Username is required' });
    }
  } catch (error) {
    console.log('Cookie auth error:', error.message);
    res.status(500).json({ error: 'Server error' });
  }
};

// Logout (clear cookies)
exports.logoutUser = (req, res) => {
  try {
    res.clearCookie('authToken', { domain: 'localhost', path: '/' });
    res.clearCookie('userId', { domain: 'localhost', path: '/' });
    
    console.log('User logged out - cookies cleared');
    
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Logout failed' });
  }
};