// Toggle Sidebar
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const toggleIcon = document.getElementById('toggleIcon');
    
    sidebar.classList.toggle('collapsed');
    
    // Save state to memory
    const isCollapsed = sidebar.classList.contains('collapsed');
    window.sidebarState = { collapsed: isCollapsed };
    
    if (!isCollapsed) {
        toggleIcon.classList.remove('fa-bars');
        toggleIcon.classList.add('fa-times');
    } else {
        toggleIcon.classList.remove('fa-times');
        toggleIcon.classList.add('fa-bars');
    }
}

// Handle Logout
function handleLogout() {
    if (confirm('Apakah Anda yakin ingin keluar?')) {
        alert('Logout berhasil! Terima kasih telah menggunakan LearningGraph.');
        fetch('/api/logout', {
            method: 'POST',
        })
        window.location.href = '/login';
    }
}

// Show Notifications
function showNotifications() {
    alert('🔔 Notifikasi:\n\n1. Quiz Matematika tersedia!\n2. Teman baru menambahkan Anda\n3. Anda naik ke peringkat #5!');
}

// Navigate to different sections
function navigateTo(section) {
    alert(`Navigasi ke halaman: ${section.toUpperCase()}\n\nFitur ini akan segera tersedia!`);
}

// Close sidebar when clicking outside on mobile
document.addEventListener('click', function (event) {
    const sidebar = document.getElementById('sidebar');
    const toggleBtn = document.getElementById('toggleBtn');

    if (window.innerWidth <= 768) {
        if (!sidebar.contains(event.target) && !toggleBtn.contains(event.target)) {
            if (!sidebar.classList.contains('collapsed')) {
                toggleSidebar();
            }
        }
    }
});

// Responsive handling
window.addEventListener('resize', function () {
    const sidebar = document.getElementById('sidebar');
    const toggleIcon = document.getElementById('toggleIcon');

    if (window.innerWidth <= 768) {
        sidebar.classList.add('collapsed');
        toggleIcon.classList.remove('fa-times');
        toggleIcon.classList.add('fa-bars');
    } else {
        sidebar.classList.remove('collapsed');
        toggleIcon.classList.remove('fa-times');
        toggleIcon.classList.add('fa-bars');
    }
});

// Initialize on load
window.addEventListener('load', function () {
    const sidebar = document.getElementById('sidebar');
    const toggleIcon = document.getElementById('toggleIcon');

    if (window.innerWidth <= 768) {
        sidebar.classList.add('collapsed');
        toggleIcon.classList.remove('fa-times');
        toggleIcon.classList.add('fa-bars');
    }
});