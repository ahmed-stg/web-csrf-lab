const API_BASE = 'http://localhost:3000/api';

// DOM Elements
const authSection = document.getElementById('authSection');
const profileSection = document.getElementById('profileSection');
const userInfo = document.getElementById('userInfo');
const welcomeMsg = document.getElementById('welcomeMsg');

// Forms
const loginForm = document.getElementById('loginFormEl');
const registerForm = document.getElementById('registerFormEl');
const editForm = document.getElementById('editFormEl');

// Buttons
const tabBtns = document.querySelectorAll('.tab-btn');
const logoutBtn = document.getElementById('logoutBtn');
const editProfileBtn = document.getElementById('editProfileBtn');
const cancelEditBtn = document.getElementById('cancelEditBtn');

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    if (token) {
        loadUserProfile();
    }
    
    setupEventListeners();
});

// Setup event listeners
function setupEventListeners() {
    // Tab switching
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tab = btn.dataset.tab;
            switchTab(tab);
        });
    });

    // Form submissions
    loginForm.addEventListener('submit', handleLogin);
    registerForm.addEventListener('submit', handleRegister);
    editForm.addEventListener('submit', handleEditProfile);

    // Buttons
    logoutBtn.addEventListener('click', handleLogout);
    editProfileBtn.addEventListener('click', showEditForm);
    cancelEditBtn.addEventListener('click', hideEditForm);
}

// Tab switching
function switchTab(tab) {
    tabBtns.forEach(btn => btn.classList.remove('active'));
    document.querySelector(`[data-tab="${tab}"]`).classList.add('active');
    
    document.getElementById('loginForm').classList.remove('active');
    document.getElementById('registerForm').classList.remove('active');
    document.getElementById(`${tab}Form`).classList.add('active');
}

// Handle login
async function handleLogin(e) {
    e.preventDefault();
    
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;

    try {
        const response = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (response.ok) {
            localStorage.setItem('token', data.token);
            showMessage('Login successful!', 'success');
            showProfileSection(data.user);
        } else {
            showMessage(data.error || 'Login failed', 'error');
        }
    } catch (error) {
        showMessage('Network error', 'error');
    }
}

// Handle register
async function handleRegister(e) {
    e.preventDefault();
    
    const username = document.getElementById('regUsername').value;
    const password = document.getElementById('regPassword').value;
    const birthdate = document.getElementById('regBirthdate').value;
    const profilePicFile = document.getElementById('regProfilePic').files[0];

    let profile_picture = null;
    if (profilePicFile) {
        profile_picture = await fileToBase64(profilePicFile);
    }

    try {
        const response = await fetch(`${API_BASE}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password, birthdate, profile_picture })
        });

        const data = await response.json();

        if (response.ok) {
            localStorage.setItem('token', data.token);
            showMessage('Registration successful!', 'success');
            showProfileSection(data.user);
        } else {
            showMessage(data.error || 'Registration failed', 'error');
        }
    } catch (error) {
        showMessage('Network error', 'error');
    }
}

// Load user profile
async function loadUserProfile() {
    const token = localStorage.getItem('token');
    
    try {
        const response = await fetch(`${API_BASE}/auth/profile`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (response.ok) {
            showProfileSection(data.user);
        } else {
            localStorage.removeItem('token');
            showAuthSection();
        }
    } catch (error) {
        localStorage.removeItem('token');
        showAuthSection();
    }
}

// Handle edit profile
async function handleEditProfile(e) {
    e.preventDefault();
    
    const token = localStorage.getItem('token');
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

    try {
        const response = await fetch(`${API_BASE}/auth/profile`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(updateData)
        });

        const data = await response.json();

        if (response.ok) {
            showMessage('Profile updated successfully!', 'success');
            hideEditForm();
            displayUserProfile(data.user);
        } else {
            showMessage(data.error || 'Update failed', 'error');
        }
    } catch (error) {
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
    
    welcomeMsg.textContent = `Welcome, ${user.username}!`;
    displayUserProfile(user);
}

function displayUserProfile(user) {
    document.getElementById('profileUsername').textContent = user.username;
    document.getElementById('profileBirthdate').textContent = new Date(user.birthdate).toLocaleDateString();
    document.getElementById('profileCreated').textContent = new Date(user.createdAt).toLocaleDateString();
    
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

function showEditForm() {
    document.getElementById('profileView').style.display = 'none';
    document.getElementById('editProfileForm').style.display = 'block';
    
    // Pre-fill current values
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
function handleLogout() {
    localStorage.removeItem('token');
    showMessage('Logged out successfully', 'success');
    showAuthSection();
}

// Utility functions
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
    
    document.getElementById('messages').appendChild(message);
    
    setTimeout(() => {
        message.remove();
    }, 5000);
}