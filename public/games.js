// Sample games loader
document.addEventListener('DOMContentLoaded', () => {
    const grid = document.getElementById('gamesGrid');
    if (!grid) return;

    const games = [
        { title: 'Kuis Cepat', icon: 'fa-bolt', desc: 'Jawab pertanyaan cepat' },
        { title: 'Puzzle', icon: 'fa-puzzle-piece', desc: 'Selesaikan puzzle' },
        { title: 'Memory Match', icon: 'fa-shapes', desc: 'Cocokkan pasangan' }
    ];

    grid.innerHTML = games.map(g => `
        <div class="game-card">
            <i class="fas ${g.icon}"></i>
            <h4>${g.title}</h4>
            <p style="color:#666; font-size:12px">${g.desc}</p>
            <a class="btn" href="#">Mainkan</a>
        </div>
    `).join('');
});
