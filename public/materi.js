// Sample materi loader
document.addEventListener('DOMContentLoaded', () => {
    const grid = document.getElementById('materialsGrid');
    if (!grid) return;

    const sample = [
        { title: 'Matematika - Aljabar', desc: 'Ringkasan dan latihan' },
        { title: 'Fisika - Gerak', desc: 'Konsep dasar dan contoh' },
        { title: 'Kimia - Ikatan', desc: 'Dasar ikatan kimia' }
    ];

    grid.innerHTML = sample.map(m => `
        <div class="material-card">
            <h4>${m.title}</h4>
            <p style="color:#666">${m.desc}</p>
            <a class="btn" href="#">Buka</a>
        </div>
    `).join('');
});
