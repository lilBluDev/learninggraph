document.addEventListener('DOMContentLoaded', async () => {
    try {
        const token = localStorage.getItem('token');
        const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
        // include credentials so cookie-based sessions work too
        const response = await fetch('/api/user', {
            headers,
            credentials: 'same-origin'
        });
        if (!response.ok) throw new Error('Failed to fetch user');
        const result = await response.json();
        const user = result.data || result;
        updateSidebarUserCard(user);
    } catch (e) {
        // fallback: try fetching with credentials only (in case token isn't in localStorage)
        try {
            const response2 = await fetch('/api/user', { credentials: 'same-origin' });
            if (response2.ok) {
                const result2 = await response2.json();
                const user2 = result2.data || result2;
                updateSidebarUserCard(user2);
                return;
            }
        } catch (e2) {
            // ignore
        }
        // keep default UI if still failing
    }
});

function updateSidebarUserCard(user) {
    const name = document.querySelector('.user-name');
    const username = document.querySelector('.user-username');
    const email = document.querySelector('.user-email');
    const avatar = document.querySelector('.user-card .avatar');
    if (name) name.textContent = user.displayName || user.name || 'Pengguna';
    if (username) username.textContent = user.username ? '@' + user.username : '@username';
    if (email) email.textContent = user.email || 'email@example.com';
    if (avatar) avatar.src = user.avatar ? user.avatar : '/public/defaultp.png';

    // Show Admin Panel link when user is admin
    try {
        const navList = document.querySelector('.sidebar-nav ul');
        console.log('isAdmin: ', user.role === 'ADMIN')
        if (navList) {
            const existing = document.querySelector('.sidebar-nav li.admin-panel');
            if (user.role && user.role === 'ADMIN') {
                if (!existing) {
                    const li = document.createElement('li');
                    li.className = 'admin-panel';
                    li.innerHTML = `<a href="/u/admin"><i class="fas fa-shield-alt"></i><span>Admin Panel</span></a>`;
                    // Insert near top (after Dashboard)
                    const firstLi = navList.querySelector('li');
                    if (firstLi && firstLi.nextSibling) {
                        navList.insertBefore(li, firstLi.nextSibling);
                    } else {
                        navList.appendChild(li);
                    }
                }
            } else {
                if (existing) existing.remove();
            }
        }
    } catch (err) {
        // Non-fatal: do nothing if DOM structure unexpected
        console.warn('Admin link toggle failed', err);
    }
}

const sidebar = document.getElementById('sidebar');
const sidebarToggle = document.getElementById('sidebarToggle');

// Mobile menu toggle
if (window.innerWidth <= 768) {
    sidebarToggle.addEventListener('click', () => {
        sidebar.classList.toggle('mobile-open');
    });
}

// Show logout confirmation modal (called from sidebar HTML)
function handleLogout() {
    const modal = document.getElementById('logoutModal');
    if (modal) {
        modal.classList.add('is-open');
        modal.setAttribute('aria-hidden', 'false');
        // trap focus if needed (simple)
        const confirmBtn = document.getElementById('logoutConfirm');
        if (confirmBtn) confirmBtn.focus();
    } else {
        // Fallback to confirm dialog
        if (confirm('Apakah Anda yakin ingin keluar?')) doLogout();
    }
}

async function doLogout() {
    try {
        await fetch('/api/logout', { method: 'POST', credentials: 'same-origin' });
    } catch (e) {
        // ignore network errors, proceed to redirect
        console.warn('Logout request failed', e);
    }
    // Clear client-side token if present
    try { localStorage.removeItem('token'); } catch(e){}
    window.location.href = '/daftarlogin';
}

function closeLogoutModal() {
    const modal = document.getElementById('logoutModal');
    if (modal) {
        modal.classList.remove('is-open');
        modal.setAttribute('aria-hidden', 'true');
    }
}

// Wire modal buttons
document.addEventListener('click', (e) => {
    const confirmBtn = document.getElementById('logoutConfirm');
    const cancelBtn = document.getElementById('logoutCancel');
    if (e.target === confirmBtn) {
        doLogout();
    }
    if (e.target === cancelBtn) {
        closeLogoutModal();
    }
    // Close modal when clicking backdrop
    const modal = document.getElementById('logoutModal');
    if (modal && e.target.classList && e.target.classList.contains('modal-backdrop')) {
        closeLogoutModal();
    }
});

// Close modal with Escape
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeLogoutModal();
});

