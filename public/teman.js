// ============================================
// teman.js - Frontend JavaScript
// ============================================

// State
let currentView = 'friends';
let friends = [];
let searchResults = [];
let receivedRequests = [];
let sentRequests = [];
let searchTimeout;

// API Functions
const API = {
    async searchUsers(query) {
        try {
            const response = await fetch(`/api/friends/search?q=${encodeURIComponent(query)}`);
            if (!response.ok) throw new Error('Failed to search users');
            const data = await response.json();
            return data.users || [];
        } catch (error) {
            console.error('Search error:', error);
            return [];
        }
    },

    async getFriends() {
        try {
            const response = await fetch('/api/friends/list');
            if (!response.ok) throw new Error('Failed to get friends');
            const data = await response.json();
            return data.friends || [];
        } catch (error) {
            console.error('Get friends error:', error);
            return [];
        }
    },

    async sendFriendRequest(userId) {
        try {
            const response = await fetch('/api/friends/request', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId })
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Failed to send request');
            return data;
        } catch (error) {
            console.error('Send request error:', error);
            throw error;
        }
    },

    async getReceivedRequests() {
        try {
            const response = await fetch('/api/friends/requests/received');
            if (!response.ok) throw new Error('Failed to get requests');
            const data = await response.json();
            return data.requests || [];
        } catch (error) {
            console.error('Get requests error:', error);
            return [];
        }
    },

    async getSentRequests() {
        try {
            const response = await fetch('/api/friends/requests/sent');
            if (!response.ok) throw new Error('Failed to get sent requests');
            const data = await response.json();
            return data.requests || [];
        } catch (error) {
            console.error('Get sent requests error:', error);
            return [];
        }
    },

    async acceptRequest(requestId) {
        try {
            const response = await fetch(`/api/friends/request/${requestId}/accept`, {
                method: 'POST'
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Failed to accept');
            return data;
        } catch (error) {
            console.error('Accept error:', error);
            throw error;
        }
    },

    async rejectRequest(requestId) {
        try {
            const response = await fetch(`/api/friends/request/${requestId}/reject`, {
                method: 'POST'
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Failed to reject');
            return data;
        } catch (error) {
            console.error('Reject error:', error);
            throw error;
        }
    },

    async cancelRequest(requestId) {
        try {
            const response = await fetch(`/api/friends/request/${requestId}/cancel`, {
                method: 'DELETE'
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Failed to cancel');
            return data;
        } catch (error) {
            console.error('Cancel error:', error);
            throw error;
        }
    },

    async removeFriend(friendId) {
        try {
            const response = await fetch(`/api/friends/${friendId}`, {
                method: 'DELETE'
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Failed to remove friend');
            return data;
        } catch (error) {
            console.error('Remove friend error:', error);
            throw error;
        }
    }
};

// Load initial data
async function loadFriends() {
    friends = await API.getFriends();
    renderFriendsList();
    updateRequestsBadge();
}

async function updateRequestsBadge() {
    receivedRequests = await API.getReceivedRequests();
    const badge = document.getElementById('requestsBadge');
    if (badge) {
        if (receivedRequests.length > 0) {
            badge.textContent = receivedRequests.length;
            badge.style.display = 'inline-block';
        } else {
            badge.style.display = 'none';
        }
    }
}

// Render friends list
function renderFriendsList() {
    const container = document.getElementById('friendsList');
    
    if (!container) return;
    
    if (friends.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-user-friends"></i>
                <h3>Belum Ada Teman</h3>
                <p>Mulai cari dan tambahkan teman untuk belajar bersama!</p>
                <button class="btn btn-primary" onclick="openSearchModal()">
                    <i class="fas fa-search"></i> Cari Teman
                </button>
            </div>
        `;
        return;
    }
    
    container.innerHTML = `
        <div class="friends-grid">
            ${friends.map(friend => `
                <div class="friend-card">
                    <img src="${friend.avatar || '/public/defaultp.png'}" alt="${friend.displayName}" class="friend-avatar">
                    <div class="friend-info">
                        <h3>${friend.displayName}</h3>
                        <p class="friend-username">@${friend.username}</p>
                        <div class="friend-stats">
                            <span><i class="fas fa-trophy"></i> Level ${friend.level}</span>
                            <span><i class="fas fa-star"></i> ${friend.xp} XP</span>
                        </div>
                        <div class="friend-status">
                            <i class="fas fa-circle ${isOnline(friend.lastLogin) ? 'online' : 'offline'}"></i>
                            ${isOnline(friend.lastLogin) ? 'Online' : getLastSeen(friend.lastLogin)}
                        </div>
                    </div>
                    <div class="friend-actions">
                        <button class="btn btn-sm btn-danger" onclick="removeFriend('${friend._id}', '${friend.displayName}')">
                            <i class="fas fa-user-minus"></i> Hapus
                        </button>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

// Open search modal
function openSearchModal() {
    const modal = document.getElementById('searchModal');
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
        document.getElementById('searchInput').focus();
    }
}

// Close search modal
function closeSearchModal() {
    const modal = document.getElementById('searchModal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = 'auto';
        document.getElementById('searchInput').value = '';
        document.getElementById('searchResults').innerHTML = '';
    }
}

// Search users
async function searchUsers() {
    const query = document.getElementById('searchInput').value.trim();
    const resultsContainer = document.getElementById('searchResults');
    
    if (query.length < 2) {
        resultsContainer.innerHTML = '<p class="search-hint">Ketik minimal 2 karakter untuk mencari...</p>';
        return;
    }
    
    resultsContainer.innerHTML = '<p class="loading">Mencari...</p>';
    
    searchResults = await API.searchUsers(query);
    
    if (searchResults.length === 0) {
        resultsContainer.innerHTML = `
            <div class="empty-state-small">
                <i class="fas fa-search"></i>
                <p>Tidak ada hasil ditemukan</p>
            </div>
        `;
        return;
    }
    
    resultsContainer.innerHTML = `
        <div class="search-results-list">
            ${searchResults.map(user => `
                <div class="user-result-card">
                    <img src="${user.avatar || '/public/defaultp.png'}" alt="${user.displayName}">
                    <div class="user-info">
                        <h4>${user.displayName}</h4>
                        <p>@${user.username}</p>
                        <div class="user-stats">
                            <span><i class="fas fa-trophy"></i> Level ${user.level}</span>
                            <span><i class="fas fa-star"></i> ${user.xp} XP</span>
                        </div>
                    </div>
                    <div class="user-action">
                        ${getUserActionButton(user)}
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

// Get appropriate action button
function getUserActionButton(user) {
    if (user.isFriend) {
        return '<span class="badge badge-success"><i class="fas fa-check"></i> Teman</span>';
    }
    
    if (user.requestStatus === 'sent') {
        return '<span class="badge badge-warning"><i class="fas fa-clock"></i> Menunggu</span>';
    }
    
    if (user.requestStatus === 'received') {
        return '<button class="btn btn-sm btn-primary" onclick="openRequestsModal()">Lihat Permintaan</button>';
    }
    
    return `<button class="btn btn-sm btn-primary" onclick="sendRequest('${user._id}', '${user.displayName}')">
        <i class="fas fa-user-plus"></i> Tambah
    </button>`;
}

// Send friend request
async function sendRequest(userId, displayName) {
    try {
        await API.sendFriendRequest(userId);
        showNotification('Permintaan pertemanan terkirim ke ' + displayName, 'success');
        
        // Refresh search results
        await searchUsers();
    } catch (error) {
        showNotification(error.message || 'Gagal mengirim permintaan', 'error');
    }
}

// Open requests modal
async function openRequestsModal() {
    const modal = document.getElementById('requestsModal');
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
        await loadRequests();
    }
}

// Close requests modal
function closeRequestsModal() {
    const modal = document.getElementById('requestsModal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = 'auto';
    }
}

// Load requests
async function loadRequests() {
    receivedRequests = await API.getReceivedRequests();
    sentRequests = await API.getSentRequests();
    renderRequests();
    updateRequestsBadge();
}

// Render requests
function renderRequests() {
    const container = document.getElementById('requestsContent');
    
    if (!container) return;
    
    container.innerHTML = `
        <div class="requests-tabs">
            <button class="request-tab active" onclick="switchRequestTab('received')">
                Masuk (${receivedRequests.length})
            </button>
            <button class="request-tab" onclick="switchRequestTab('sent')">
                Terkirim (${sentRequests.length})
            </button>
        </div>
        
        <div id="receivedRequestsTab" class="request-tab-content active">
            ${receivedRequests.length === 0 ? 
                '<p class="empty-message">Tidak ada permintaan masuk</p>' :
                `<div class="requests-list">
                    ${receivedRequests.map(req => `
                        <div class="request-card">
                            <img src="${req.from.avatar || '/public/defaultp.png'}" alt="${req.from.displayName}">
                            <div class="request-info">
                                <h4>${req.from.displayName}</h4>
                                <p>@${req.from.username}</p>
                                <small>${getTimeAgo(req.createdAt)}</small>
                            </div>
                            <div class="request-actions">
                                <button class="btn btn-sm btn-success" onclick="acceptRequest('${req._id}', '${req.from.displayName}')">
                                    <i class="fas fa-check"></i>
                                </button>
                                <button class="btn btn-sm btn-danger" onclick="rejectRequest('${req._id}')">
                                    <i class="fas fa-times"></i>
                                </button>
                            </div>
                        </div>
                    `).join('')}
                </div>`
            }
        </div>
        
        <div id="sentRequestsTab" class="request-tab-content">
            ${sentRequests.length === 0 ? 
                '<p class="empty-message">Tidak ada permintaan terkirim</p>' :
                `<div class="requests-list">
                    ${sentRequests.map(req => `
                        <div class="request-card">
                            <img src="${req.to.avatar || '/public/defaultp.png'}" alt="${req.to.displayName}">
                            <div class="request-info">
                                <h4>${req.to.displayName}</h4>
                                <p>@${req.to.username}</p>
                                <small>${getTimeAgo(req.createdAt)}</small>
                            </div>
                            <div class="request-actions">
                                <button class="btn btn-sm btn-outline" onclick="cancelRequest('${req._id}')">
                                    <i class="fas fa-times"></i> Batalkan
                                </button>
                            </div>
                        </div>
                    `).join('')}
                </div>`
            }
        </div>
    `;
}

// Switch request tab
function switchRequestTab(tab) {
    const tabs = document.querySelectorAll('.request-tab');
    const contents = document.querySelectorAll('.request-tab-content');
    
    tabs.forEach(t => t.classList.remove('active'));
    contents.forEach(c => c.classList.remove('active'));
    
    if (tab === 'received') {
        tabs[0].classList.add('active');
        document.getElementById('receivedRequestsTab').classList.add('active');
    } else {
        tabs[1].classList.add('active');
        document.getElementById('sentRequestsTab').classList.add('active');
    }
}

// Accept request
async function acceptRequest(requestId, displayName) {
    try {
        await API.acceptRequest(requestId);
        showNotification('Kamu berteman dengan ' + displayName, 'success');
        await loadRequests();
        await loadFriends();
    } catch (error) {
        showNotification(error.message || 'Gagal menerima permintaan', 'error');
    }
}

// Reject request
async function rejectRequest(requestId) {
    try {
        await API.rejectRequest(requestId);
        showNotification('Permintaan ditolak', 'info');
        await loadRequests();
    } catch (error) {
        showNotification(error.message || 'Gagal menolak permintaan', 'error');
    }
}

// Cancel request
async function cancelRequest(requestId) {
    try {
        await API.cancelRequest(requestId);
        showNotification('Permintaan dibatalkan', 'info');
        await loadRequests();
    } catch (error) {
        showNotification(error.message || 'Gagal membatalkan permintaan', 'error');
    }
}

// Remove friend
async function removeFriend(friendId, displayName) {
    if (!confirm(`Hapus ${displayName} dari daftar teman?`)) return;
    
    try {
        await API.removeFriend(friendId);
        showNotification('Teman berhasil dihapus', 'info');
        await loadFriends();
    } catch (error) {
        showNotification(error.message || 'Gagal menghapus teman', 'error');
    }
}

// Helper functions
function isOnline(lastLogin) {
    if (!lastLogin) return false;
    const diff = Date.now() - new Date(lastLogin).getTime();
    return diff < 5 * 60 * 1000; // 5 minutes
}

function getLastSeen(lastLogin) {
    if (!lastLogin) return 'Tidak diketahui';
    const diff = Date.now() - new Date(lastLogin).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days} hari lalu`;
    if (hours > 0) return `${hours} jam lalu`;
    if (minutes > 0) return `${minutes} menit lalu`;
    return 'Baru saja';
}

function getTimeAgo(date) {
    if (!date) return '';
    const diff = Date.now() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days} hari lalu`;
    if (hours > 0) return `${hours} jam lalu`;
    if (minutes > 0) return `${minutes} menit lalu`;
    return 'Baru saja';
}

// Show notification
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
        <span>${message}</span>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    console.log('Teman page loaded');
    loadFriends();
    
    // Setup search input
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(searchUsers, 300);
        });
    }
    
    // Close modals on outside click
    window.addEventListener('click', (e) => {
        const searchModal = document.getElementById('searchModal');
        const requestsModal = document.getElementById('requestsModal');
        
        if (e.target === searchModal) {
            closeSearchModal();
        }
        if (e.target === requestsModal) {
            closeRequestsModal();
        }
    });
    
    // Refresh requests badge every 30 seconds
    setInterval(updateRequestsBadge, 30000);
});