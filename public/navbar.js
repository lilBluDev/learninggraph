// Navbar auth logic: show/hide login/daftar/logout, handle logout

document.addEventListener('DOMContentLoaded', () => {
    const navAuth = document.querySelector('.nav-auth');
    if (!navAuth) return;

    // Remove old logout if exists
    let logoutBtn = document.getElementById('navbarDashboardBtn');
    if (logoutBtn) logoutBtn.remove();

    // Check token
    const token = localStorage.getItem('token');
    if (token) {
        // Hide login/daftar, show logout
        navAuth.innerHTML = `<button id="navbarDashboardBtn" class="nav-dash">Ke Dashboard</button>`;
        document.getElementById('navbarDashboardBtn').addEventListener('click', () => {
            window.location.href = '/u/';
        });
    } else {
        // Show login/daftar
        navAuth.innerHTML = `
            <a href="/daftarlogin" class="nav-login">Login</a>
            <a href="/daftarlogin" class="nav-daftar">Daftar</a>
        `;
    }
});
