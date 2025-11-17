// Leaderboard Nasional Sorter
const leaderboardData = {
    SMA: [
        { name: "Ayu Pratama", score: 12500 },
        { name: "Budi Santoso", score: 11800 },
        { name: "Citra Dewi", score: 10950 },
        { name: "Deni Kurniawan", score: 9700 },
        { name: "Eka Putri", score: 8900 }
    ],
    SMP: [
        { name: "Fajar", score: 8700 },
        { name: "Gita", score: 8600 },
        { name: "Hana", score: 8500 },
        { name: "Irfan", score: 8400 },
        { name: "Joko", score: 8300 }
    ],
    SD: [
        { name: "Kiki", score: 8000 },
        { name: "Lina", score: 7900 },
        { name: "Mira", score: 7800 },
        { name: "Nina", score: 7700 },
        { name: "Omar", score: 7600 }
    ],
    TK: [
        { name: "Putra", score: 7000 },
        { name: "Qila", score: 6900 },
        { name: "Rama", score: 6800 },
        { name: "Sari", score: 6700 },
        { name: "Tio", score: 6600 }
    ]
};

function renderLeaderboard(category) {
    const podium = document.getElementById('podiumContainer');
    const list = document.getElementById('leaderboardList');
    podium.innerHTML = '';
    list.innerHTML = '';

    // Render top-3 into podium
    leaderboardData[category].forEach((item, idx) => {
        if (idx < 3) {
            const slot = document.createElement('div');
            slot.className = 'podium-slot ' + (idx === 0 ? 'first' : (idx === 1 ? 'second' : 'third'));
            // use placeholder avatar (can replace with user avatar URL)
            const avatarSrc = '/public/lglogo.png';
            slot.innerHTML = `
                <div class="podium-avatar-wrap">
                    <img src="${avatarSrc}" alt="${item.name}" class="podium-avatar">
                    <div class="podium-rank">${idx+1}</div>
                </div>
                <div class="podium-base"></div>
                <div class="podium-meta">
                    <div class="podium-name">${item.name}</div>
                    <div class="podium-score">XP ${item.score}</div>
                </div>
            `;
            podium.appendChild(slot);
        } else {
            // ranks 4..n go to right-side list
            const row = document.createElement('div');
            row.className = 'leaderboard-item';
            row.innerHTML = `
                <span class="rank">${idx+1}</span>
                <div class="meta">
                    <span class="name">${item.name}</span>
                    <span class="score">XP: ${item.score}</span>
                </div>
            `;
            list.appendChild(row);
        }
    });
}

function setActiveFilter(category) {
    document.querySelectorAll('.leaderboard-filter button').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.cat === category);
    });
}

document.addEventListener('DOMContentLoaded', function() {
    const filterBtns = document.querySelectorAll('.leaderboard-filter button');
    filterBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const cat = this.dataset.cat;
            renderLeaderboard(cat);
            setActiveFilter(cat);
        });
    });
    renderLeaderboard('SMA');
    setActiveFilter('SMA');
});
