// Fetch lomba posters for homepage info-lomba
async function fetchLombaPosters() {
    try {
        const res = await fetch('/api/lombas/posters');
        const json = await res.json();
        if (!json.success) return [];
        return json.data || [];
    } catch (e) {
        console.error('Failed to load lomba posters', e);
        return [];
    }
}

function renderLombaPosters(items) {
    const container = document.getElementById('infoLombaContainer');
    if (!container) return;
    container.innerHTML = '';

    if (!items || items.length === 0) {
        container.innerHTML = `<div class="lomba-empty">Belum ada info lomba saat ini.</div>`;
        return;
    }

    items.forEach(item => {
        const card = document.createElement('div');
        card.className = 'lomba-card';
        card.innerHTML = `<img src="${item.poster}" alt="${item.title}">`;
        container.appendChild(card);
    });
}

// Init
document.addEventListener('DOMContentLoaded', async () => {
    const items = await fetchLombaPosters();
    renderLombaPosters(items);
});
