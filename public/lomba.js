// Lomba page functions
function filterCompetition(status) {
    // Update active button
    document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    
    // Filter logic would go here
    loadCompetitions(status);
}

document.addEventListener('DOMContentLoaded', () => {
    loadCompetitions('all');
});

function loadCompetitions(status) {
    const grid = document.getElementById('competitionsGrid');
    
    const competitions = [
        { name: 'Lomba Matematika', subject: 'Matematika', status: 'ongoing', date: '2024-12-15' },
        { name: 'Lomba Fisika', subject: 'Fisika', status: 'upcoming', date: '2024-12-20' },
        { name: 'Lomba IPA', subject: 'IPA', status: 'finished', date: '2024-11-10' }
    ];

    const filtered = status === 'all' ? competitions : competitions.filter(c => c.status === status);

    if (filtered.length === 0) {
        grid.innerHTML = '<p class="empty-state">Belum ada lomba</p>';
        return;
    }

    grid.innerHTML = filtered.map(c => `
        <div class="competition-card">
            <span class="status">${c.status}</span>
            <h4>${c.name}</h4>
            <p style="color:#666; font-size:12px">${c.subject}</p>
            <p style="color:#999; font-size:11px;"><i class="fas fa-calendar"></i> ${c.date}</p>
            <a class="btn" href="#">Lihat Detail</a>
        </div>
    `).join('');
}
