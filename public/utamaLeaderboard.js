// Fetch leaderboard from API and render top 5
async function fetchLeaderboard() {
    try {
        const res = await fetch('/api/leaderboard');
        const json = await res.json();
        if (!json.success) throw new Error(json.message || 'Failed to load leaderboard');
        return json.data || [];
    } catch (e) {
        console.error('Leaderboard fetch error', e);
        return [];
    }
}

function renderLeaderboardList(items) {
    const podium = document.getElementById('podiumContainer');
    const list = document.getElementById('leaderboardList');
    if (!podium || !list) return;
    podium.innerHTML = '';
    list.innerHTML = '';

    items.forEach((user, idx) => {
        const name = user.displayName || user.username;
        const avatar = user.avatar || '/public/defaultp.png';
        const score = user.xp || 0;

        if (idx < 3) {
            const slot = document.createElement('div');
            slot.className = 'podium-slot ' + (idx === 0 ? 'first' : (idx === 1 ? 'second' : 'third'));
            slot.innerHTML = `
                <div class="podium-avatar-wrap">
                    <img src="${avatar}" alt="${name}" class="podium-avatar">
                    <div class="podium-rank">${idx+1}</div>
                </div>
                <div class="podium-base"></div>
                <div class="podium-meta">
                    <div class="podium-name">${name}</div>
                    <div class="podium-score">Level ${user.level} · XP ${score}</div>
                </div>
            `;
            podium.appendChild(slot);
        } else {
            const row = document.createElement('div');
            row.className = 'leaderboard-item';
            row.innerHTML = `
                <span class="rank">${idx+1}</span>
                <div class="meta">
                    <span class="name">${name}</span>
                    <span class="score">Level ${user.level} · XP ${score}</span>
                </div>
            `;
            list.appendChild(row);
        }
    });
}

document.addEventListener('DOMContentLoaded', async function() {
    const items = await fetchLeaderboard();
    renderLeaderboardList(items);
});
