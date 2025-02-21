document.addEventListener('DOMContentLoaded', function() {
    // Get DOM elements
    const registerForm = document.getElementById('register-form');
    const loginForm = document.getElementById('login-form');
    const showLoginBtn = document.getElementById('show-login');
    const showRegisterBtn = document.getElementById('show-register');
    const registerMessage = document.getElementById('register-message');
    const loginMessage = document.getElementById('login-message');

    // Check if user is already logged in
    // const token = localStorage.getItem('token');
    // if (token) {
    //     const role = localStorage.getItem('role');
    //     window.location.href = role === 'admin' ? 'public/admin.html' : 'public/dashboard.html';
    //     return;
    // }

    // Toggle between forms
    showLoginBtn.addEventListener('click', () => {
        registerForm.classList.add('hidden');
        loginForm.classList.remove('hidden');
        clearMessages();
    });

    showRegisterBtn.addEventListener('click', () => {
        loginForm.classList.add('hidden');
        registerForm.classList.remove('hidden');
        clearMessages();
    });

    // Clear message boxes
    function clearMessages() {
        registerMessage.className = 'message';
        loginMessage.className = 'message';
        registerMessage.textContent = '';
        loginMessage.textContent = '';
    }

    // Show message
    function showMessage(element, message, type) {
        element.textContent = message;
        element.className = `message ${type}`;
    }

    // Register form submission
    document.getElementById('register').addEventListener('submit', async (e) => {
        e.preventDefault();
        clearMessages();

        const username = document.getElementById('username').value;
        const role = document.getElementById('role').value;
        const password = document.getElementById('password').value;

        try {
            const response = await fetch('http://localhost:5000/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, role, password }),
            });

            const data = await response.json();

            if (response.ok) {
                showMessage(registerMessage, 'Registration successful! Please login.', 'success');
                document.getElementById('register').reset();
                
                // Switch to login form after 5 seconds
                setTimeout(() => {
                    registerForm.classList.add('hidden');
                    loginForm.classList.remove('hidden');
                    document.getElementById('login-username').value = username;
                    clearMessages();
                }, 5000);
            } else {
                showMessage(registerMessage, 'User already exists. Please login.', 'error');
                // Switch to login form after 3 seconds
                setTimeout(() => {
                    registerForm.classList.add('hidden');
                    loginForm.classList.remove('hidden');
                    document.getElementById('login-username').value = username;
                    clearMessages();
                }, 3000);
            }
        } catch (error) {
            showMessage(registerMessage, 'Server error. Please try again.', 'error');
        }
    });

    // Login form submission
    document.getElementById('login').addEventListener('submit', async (e) => {
        e.preventDefault();
        clearMessages();

        const username = document.getElementById('login-username').value;
        const password = document.getElementById('login-password').value;

        try {
            const response = await fetch('http://localhost:5000/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
            });

            const data = await response.json();

            if (response.ok) {
                showMessage(loginMessage, 'Login successful! Redirecting...', 'success');
                localStorage.setItem('token', data.token);
                
                // Get user role from JWT token
                const tokenPayload = JSON.parse(atob(data.token.split('.')[1]));
                const userRole = tokenPayload.role;
                localStorage.setItem('role', userRole);
                
                // Show success message for 5 seconds before redirecting
                setTimeout(() => {
                    window.location.href = userRole === 'admin' ? 'public/admin.html' : 'public/dashboard.html';
                }, 5000);
            } else {
                showMessage(loginMessage, 'Invalid username or password', 'error');
            }
        } catch (error) {
            showMessage(loginMessage, 'Server error. Please try again.', 'error');
        }
    });
});