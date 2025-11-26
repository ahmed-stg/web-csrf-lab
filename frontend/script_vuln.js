const API_BASE = 'http://localhost:3000/api';

// DOM Elements
const authSection = document.getElementById('authSection');
const profileSection = document.getElementById('profileSection');
const userInfo = document.getElementById('userInfo');
const welcomeMsg = document.getElementById('welcomeMsg');

// Forms
const cookieLoginForm = document.getElementById('cookieLoginFormEl');
const registerForm = document.getElementById('registerFormEl');
const editForm = document.getElementById('editFormEl');

// Buttons
const tabBtns = document.querySelectorAll('.tab-btn');
const logoutBtn = document.getElementById('logoutBtn');
const editProfileBtn = document.getElementById('editProfileBtn');
const cancelEditBtn = document.getElementById('cancelEditBtn');
const refreshBtn = document.getElementById('refreshBtn');

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚨 VULNERABLE APP LOADED - Cookie-based auth enabled');
    checkExistingCookies();
    setupEventListeners();
});

// Setup event listeners
function setupEventListeners() {
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tab = btn.dataset.tab;
            switchTab(tab);
        });
    });

    cookieLoginForm.addEventListener('submit', handleCookieLogin);
    registerForm.addEventListener('submit', handleCookieRegister);
    editForm.addEventListener('submit', handleEditProfile);

    logoutBtn.addEventListener('click', handleLogout);
    editProfileBtn.addEventListener('click', showEditForm);
    cancelEditBtn.addEventListener('click', hideEditForm);
    refreshBtn.addEventListener('click', refreshProfile);
}

// Check for existing cookies on load
function checkExistingCookies() {
    const cookies = document.cookie;
    if (cookies.includes('authToken') || cookies.includes('userId')) {
        console.log('🍪 Found existing authentication cookies');
        console.log('Cookies:', cookies);
        loadUserProfile();
    } else {
        console.log('📭 No authentication cookies found');
    }
}

// Tab switching
function switchTab(tab) {
    tabBtns.forEach(btn => btn.classList.remove('active'));
    document.querySelector(`[data-tab="${tab}"]`).classList.add('active');
    
    document.getElementById('cookieLoginForm').classList.remove('active');
    document.getElementById('registerForm').classList.remove('active');
    document.getElementById(`${tab}Form`).classList.add('active');
}

// Handle COOKIE LOGIN (VULNERABLE)
async function handleCookieLogin(e) {
    e.preventDefault();
    
    const username = document.getElementById('cookieLoginUsername').value;
    const password = document.getElementById('cookieLoginPassword').value;

    console.log('🍪 Attempting cookie-based login (VULNERABLE)...');

    try {
        const response = await fetch(`${API_BASE}/auth/cookie-login`, {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (response.ok) {
            console.log('🚨 VULNERABLE LOGIN SUCCESS');
            console.log('🍪 Cookies set by server:', document.cookie);
            console.log('⚠️ These cookies will be sent automatically with ALL requests!');
            
            showMessage('🚨 Login successful! Session is vulnerable to CSRF!', 'warning');
            showProfileSection(data.user);
            displayCookieInfo();
        } else {
            showMessage(data.error || 'Login failed', 'error');
        }
    } catch (error) {
        console.error('Login error:', error);
        showMessage('Network error', 'error');
    }
}

// Handle COOKIE REGISTER (VULNERABLE)
async function handleCookieRegister(e) {
    e.preventDefault();
    
    const username = document.getElementById('regUsername').value;
    const password = document.getElementById('regPassword').value;
    const birthdate = document.getElementById('regBirthdate').value;
    const profilePicFile = document.getElementById('regProfilePic').files[0];

    let profile_picture = null;
    if (profilePicFile) {
        profile_picture = await fileToBase64(profilePicFile);
    }

    console.log('🍪 Attempting cookie-based registration (VULNERABLE)...');

    try {
        const response = await fetch(`${API_BASE}/auth/cookie-register`, {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password, birthdate, profile_picture })
        });

        const data = await response.json();

        if (response.ok) {
            console.log('🚨 VULNERABLE REGISTRATION SUCCESS');
            console.log('🍪 Cookies set:', document.cookie);
            
            showMessage('Registration successful! Cookie auth enabled.', 'success');
            showProfileSection(data.user);
            displayCookieInfo();
        } else {
            showMessage(data.error || 'Registration failed', 'error');
        }
    } catch (error) {
        console.error('Registration error:', error);
        showMessage('Network error', 'error');
    }
}

// Load user profile using cookies
async function loadUserProfile() {
    console.log('📡 Loading profile using cookies...');
    
    try {
        const response = await fetch(`${API_BASE}/auth/cookie-profile`, {
            credentials: 'include',
        });

        const data = await response.json();

        if (response.ok) {
            console.log('✅ Profile loaded using cookies');
            showProfileSection(data.user);
            displayCookieInfo();
        } else {
            console.log('❌ Profile load failed');
            showAuthSection();
        }
    } catch (error) {
        console.error('Profile load error:', error);
        showAuthSection();
    }
}

// Refresh profile
async function refreshProfile() {
    console.log('🔄 Refreshing profile...');
    await loadUserProfile();
    showMessage('Profile refreshed!', 'info');
}

// Handle edit profile (VULNERABLE - uses cookies)
async function handleEditProfile(e) {
    e.preventDefault();
    
    const username = document.getElementById('editUsername').value;
    const password = document.getElementById('editPassword').value;
    const birthdate = document.getElementById('editBirthdate').value;
    const profilePicFile = document.getElementById('editProfilePic').files[0];

    const updateData = {};
    if (username) updateData.username = username;
    if (password) updateData.password = password;
    if (birthdate) updateData.birthdate = birthdate;
    if (profilePicFile) {
        updateData.profile_picture = await fileToBase64(profilePicFile);
    }

    console.log('🍪 Updating profile via cookies (VULNERABLE)...');

    try {
        const response = await fetch(`${API_BASE}/auth/cookie-profile`, {
            method: 'PUT',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(updateData)
        });

        const data = await response.json();

        if (response.ok) {
            console.log('✅ Profile updated via cookies');
            showMessage('Profile updated successfully!', 'success');
            hideEditForm();
            displayUserProfile(data.user);
            displayCookieInfo();
        } else {
            showMessage(data.error || 'Update failed', 'error');
        }
    } catch (error) {
        console.error('Update error:', error);
        showMessage('Network error', 'error');
    }
}

// Show/hide sections
function showAuthSection() {
    authSection.style.display = 'block';
    profileSection.style.display = 'none';
    userInfo.style.display = 'none';
}

function showProfileSection(user) {
    authSection.style.display = 'none';
    profileSection.style.display = 'block';
    userInfo.style.display = 'flex';
    
    welcomeMsg.textContent = `Welcome, ${user.username}! 🚨`;
    displayUserProfile(user);
}

function displayUserProfile(user) {
    document.getElementById('profileUsername').textContent = user.username;
    document.getElementById('profileBirthdate').textContent = new Date(user.birthdate).toLocaleDateString();
    document.getElementById('profileUserId').textContent = user.id;
    
    const profileImg = document.getElementById('profileImg');
    const noProfileImg = document.getElementById('noProfileImg');
    
    if (user.profile_picture) {
        profileImg.src = user.profile_picture;
        profileImg.style.display = 'block';
        noProfileImg.style.display = 'none';
    } else {
        profileImg.style.display = 'none';
        noProfileImg.style.display = 'flex';
    }
}

// Display cookie information
function displayCookieInfo() {
    const cookieInfo = document.getElementById('cookieInfo');
    const cookies = document.cookie.split(';').map(c => c.trim());
    
    let html = '<strong>🍪 Current Cookies (accessible via JavaScript!):</strong><br>';
    cookies.forEach(cookie => {
        const [name, value] = cookie.split('=');
        if (name === 'authToken' || name === 'userId') {
            html += `&nbsp;&nbsp;• ${name}: ${value.substring(0, 20)}...<br>`;
        }
    });
    html += '<br><em style="color: #d63031;">⚠️ These cookies are sent automatically with EVERY request!</em>';
    
    cookieInfo.innerHTML = html;
}

function showEditForm() {
    document.getElementById('profileView').style.display = 'none';
    document.getElementById('editProfileForm').style.display = 'block';
    
    const currentUser = {
        username: document.getElementById('profileUsername').textContent,
        birthdate: document.getElementById('profileBirthdate').textContent
    };
    
    document.getElementById('editUsername').value = currentUser.username;
    document.getElementById('editBirthdate').value = new Date(currentUser.birthdate).toISOString().split('T')[0];
}

function hideEditForm() {
    document.getElementById('profileView').style.display = 'block';
    document.getElementById('editProfileForm').style.display = 'none';
    editForm.reset();
}

// Handle logout
async function handleLogout() {
    try {
        await fetch(`${API_BASE}/auth/logout`, {
            method: 'POST',
            credentials: 'include'
        });
    } catch (e) {
        console.log('Logout request failed');
    }
    
    // Clear cookies manually
    document.cookie.split(";").forEach(c => {
        document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/;domain=localhost");
    });
    
    console.log('🚪 Logged out - cookies cleared');
    showMessage('Logged out successfully', 'success');
    showAuthSection();
}

// Utility functions
function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
}

function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });
}

function showMessage(text, type) {
    const message = document.createElement('div');
    message.className = `message ${type}`;
    message.textContent = text;
    
    const messagesContainer = document.getElementById('messages');
    messagesContainer.appendChild(message);
    
    setTimeout(() => {
        message.remove();
    }, 5000);
}

// Console logging
console.log('═══════════════════════════════════════════════');
console.log('🚨 VULNERABLE APPLICATION LOADED');
console.log('═══════════════════════════════════════════════');
console.log('Cookie-based authentication (NO CSRF protection)');
console.log('All requests use credentials: include');
console.log('Cookies: httpOnly=false, sameSite=lax');
console.log('═══════════════════════════════════════════════');