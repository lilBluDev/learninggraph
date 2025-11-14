function togglePassword(inputId, button) {
    const input = document.getElementById(inputId);
    const svg = button.querySelector('svg');

    if (input.type === 'password') {
        input.type = 'text';
        button.classList.add('active');
        svg.innerHTML = `
            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
            <line x1="1" y1="1" x2="23" y2="23"></line>
        `;
    } else {
        input.type = 'password';
        button.classList.remove('active');
        svg.innerHTML = `
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
            <circle cx="12" cy="12" r="3"></circle>
        `;
    }
}

async function handleLogin(event) {
    event.preventDefault();

    const usernameOrEmail = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const submitBtn = event.target.querySelector('button[type="submit"]');
    
    // Disable button saat loading
    submitBtn.disabled = true;
    submitBtn.textContent = 'Memproses...';

    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                usernameOrEmail,
                password
            })
        });

        const data = await response.json();

        if (data.success) {
            console.log("success", data)
            // Simpan token ke localStorage
            localStorage.setItem('token', data.data.token);
            console.log("token saved")
            
            // Tampilkan pesan sukses
            const successMsg = document.getElementById('loginSuccess');
            successMsg.classList.add('show');

            console.log("redirecting...")
            setTimeout(() => {
                // Redirect ke dashboard
                window.location.href = '/u';
            }, 1500);
        } else {
            alert(data.message || 'Login gagal. Silakan coba lagi.');
            submitBtn.disabled = false;
            submitBtn.textContent = 'Masuk';
        }
    } catch (error) {
        console.error('Login error:', error);
        alert('Terjadi kesalahan. Silakan coba lagi.');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Masuk';
    }
}

async function handleRegister(event) {
    event.preventDefault();

    const username = document.getElementById('registerName').value.toLowerCase().replace(/\s+/g, '');
    const displayName = document.getElementById('registerName').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const submitBtn = event.target.querySelector('button[type="submit"]');

    if (password !== confirmPassword) {
        alert('Password tidak cocok!');
        return;
    }

    // Disable button saat loading
    submitBtn.disabled = true;
    submitBtn.textContent = 'Memproses...';

    try {
        const response = await fetch('/api/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username,
                displayName,
                email,
                password,
                selectedSubjects: []
            })
        });

        const data = await response.json();

        if (data.success) {
            // Simpan token ke localStorage
            localStorage.setItem('token', data.data.token);
            
            // Tampilkan pesan sukses
            const successMsg = document.getElementById('registerSuccess');
            successMsg.classList.add('show');

            setTimeout(() => {
                // Redirect ke dashboard
                window.location.href = '/u';
            }, 1500);
        } else {
            alert(data.message || 'Pendaftaran gagal. Silakan coba lagi.');
            submitBtn.disabled = false;
            submitBtn.textContent = 'Daftar';
        }
    } catch (error) {
        console.error('Register error:', error);
        alert('Terjadi kesalahan. Silakan coba lagi.');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Daftar';
    }
}