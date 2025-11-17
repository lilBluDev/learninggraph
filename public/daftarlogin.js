// Toggle between login and signup forms
function toggleForms() {
    const signupForm = document.getElementById('signupForm');
    const loginForm = document.getElementById('loginForm');

    signupForm.classList.toggle('hidden');
    loginForm.classList.toggle('hidden');
}

// Toggle password visibility
function togglePassword(inputId, button) {
    const input = document.getElementById(inputId);
    const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
    input.setAttribute('type', type);

    // Update icon
    const svg = button.querySelector('svg');
    if (type === 'text') {
        svg.innerHTML = '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line>';
    } else {
        svg.innerHTML = '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle>';
    }
}

// Show error message
function showError(message) {
    let errorDiv = document.querySelector('.error-message');
    if (!errorDiv) {
        errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        const form = document.querySelector('form');
        form.insertBefore(errorDiv, form.firstChild);
    }
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';

    setTimeout(() => {
        errorDiv.style.display = 'none';
    }, 5000);
}

// Show success message
function showSuccess(elementId, message) {
    const successDiv = document.getElementById(elementId);
    if (successDiv) {
        successDiv.textContent = message;
        successDiv.style.display = 'block';

        setTimeout(() => {
            successDiv.style.display = 'none';
        }, 3000);
    }
}

// Handle Register
async function handleRegister(event) {
    event.preventDefault();

    const name = document.getElementById('registerName').value.trim();
    const email = document.getElementById('registerEmail').value.trim();
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    // Validate
    if (password !== confirmPassword) {
        showError('Password tidak cocok!');
        return;
    }

    if (password.length < 6) {
        showError('Password minimal 6 karakter!');
        return;
    }

    // Generate username from email
    const username = email.split('@')[0].toLowerCase();

    const submitBtn = event.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Mendaftar...';

    try {
        const response = await fetch('/api/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({
                username: username,
                displayName: name,
                email: email,
                password: password,
                selectedSubjects: []
            })
        });

        const data = await response.json();

        if (data.success) {
            showSuccess('registerSuccess', data.message || 'Pendaftaran berhasil!');

            if (data.data?.token) {
                localStorage.setItem('token', data.data.token);
            }

            setTimeout(() => {
                window.location.href = '/u';
            }, 1000);
        } else {
            showError(data.message || 'Pendaftaran gagal!');
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        }
    } catch (error) {
        console.error('Register error:', error);
        showError('Terjadi kesalahan. Silakan coba lagi.');
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
}

// Handle Login
async function handleLogin(event) {
    event.preventDefault();

    const usernameOrEmail = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;

    if (!usernameOrEmail || !password) {
        showError('Semua field harus diisi!');
        return;
    }

    const submitBtn = event.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Masuk...';

    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({
                usernameOrEmail: usernameOrEmail,
                password: password
            })
        });

        const data = await response.json();

        if (data.success) {
            showSuccess('loginSuccess', data.message || 'Login berhasil!');

            if (data.data?.token) {
                localStorage.setItem('token', data.data.token);
            }

            setTimeout(() => {
                window.location.href = '/u';
            }, 1000);
        } else {
            showError(data.message || 'Login gagal!');
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        }
    } catch (error) {
        console.error('Login error:', error);
        showError('Terjadi kesalahan. Silakan coba lagi.');
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
}