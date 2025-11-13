window.addEventListener('scroll', function() {
    const topbar = document.getElementById('topbar');
    if (window.scrollY > 20) {
        topbar.classList.add('lpnavbarfixed'); // Tambahkan class fixed saat scroll
    } else {
        topbar.classList.remove('lpnavbarfixed'); // Hapus class saat kembali ke atas
    }
});