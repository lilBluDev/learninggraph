// Teman page functions
function showAddFriendModal() {
    alert('Fitur tambah teman akan segera hadir!');
}

document.addEventListener('DOMContentLoaded', () => {
    const grid = document.getElementById('friendsGrid');
    const emptyState = document.getElementById('emptyState');
    const searchInput = document.getElementById('searchFriends');

    // Mock friends data
    const friends = [];

    if (friends.length === 0) {
        grid.style.display = 'none';
        emptyState.style.display = 'block';
    } else {
        grid.innerHTML = friends.map(f => `
            <div class="friend-card">
                <img src="/public/lglogo.png" alt="${f.name}" class="friend-avatar">
                <h4>${f.name}</h4>
                <p style="color:#666; font-size:12px">${f.level}</p>
                <button class="btn" onclick="removeFriend('${f.id}')"><i class="fas fa-trash"></i></button>
            </div>
        `).join('');
    }

    searchInput.addEventListener('keyup', () => {
        const query = searchInput.value.toLowerCase();
        // Filter logic would go here
    });
});

function removeFriend(id) {
    if (confirm('Hapus teman?')) {
        alert('Teman dihapus');
    }
}
