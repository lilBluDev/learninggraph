const sidebar = document.getElementById('sidebar');
const sidebarToggle = document.getElementById('sidebarToggle');

sidebarToggle.addEventListener('click', () => {
    sidebar.classList.toggle('collapsed');
});

// Mobile menu toggle
if (window.innerWidth <= 768) {
    sidebarToggle.addEventListener('click', () => {
        sidebar.classList.toggle('mobile-open');
    });
}

function handleLogout() {
    if (confirm('Apakah Anda yakin ingin keluar?')) {
        fetch('/api/logout', {
            method: 'POST',
        })
        window.location.href = '/login';
    }
}

