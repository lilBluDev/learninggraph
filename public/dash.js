// Dashboard Script untuk menampilkan data user dari API

class DashboardManager {
    constructor() {
        this.token = localStorage.getItem('token');
        this.userData = null;
        this.init();
    }

    async init() {
        if (!this.token) {
            window.location.href = '/login';
            return;
        }

        await this.loadUserData();
        this.setupEventListeners();
    }

    // Load data user dari API
    async loadUserData() {
        try {
            const response = await fetch('/api/me', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();

            if (data.success) {
                this.userData = data.data.user;
                this.renderUserData();
            } else {
                // Token tidak valid, redirect ke login
                localStorage.removeItem('token');
                window.location.href = '/login';
            }
        } catch (error) {
            console.error('Error loading user data:', error);
            alert('Gagal memuat data user');
        }
    }

    // Render data user ke HTML
    renderUserData() {
        const user = this.userData;

        // Update elemen-elemen di HTML
        this.updateElement('userName', user.displayName);
        this.updateElement('userUsername', `@${user.username}`);
        this.updateElement('userEmail', user.email);
        this.updateElement('userLevel', user.level);
        this.updateElement('userXP', user.xp);
        this.updateElement('userDescription', user.description || 'Belum ada deskripsi');
        
        // Update avatar jika ada
        const avatarImg = document.getElementById('userAvatar');
        if (avatarImg) {
            avatarImg.src = user.avatar;
        }

        // Render friends
        this.renderFriends(user.friends);

        // Render selected subjects
        this.renderSubjects(user.selectedSubjects);

        // Render achievements
        this.renderAchievements(user.achievements);

        // Update progress bar XP
        this.updateXPProgress(user.xp, user.level);

        // Update last login
        this.updateElement('lastLogin', this.formatDate(user.lastLogin));
    }

    // Helper untuk update element
    updateElement(id, value) {
        const element = document.querySelectorAll('#'+id);
        if (element.length > 0) {
            element.forEach(e => {
                e.textContent = value
            })
        }
    }

    // Render daftar teman
    renderFriends(friends) {
        const friendsList = document.getElementById('friendsList');
        if (!friendsList) return;

        if (!friends || friends.length === 0) {
            friendsList.innerHTML = '<p class="empty-state">Belum ada teman</p>';
            return;
        }

        friendsList.innerHTML = friends.map(friendId => `
            <div class="friend-item" data-id="${friendId}">
                <img src="/public/default-avatar.png" alt="Friend Avatar" class="friend-avatar">
                <span class="friend-name">Friend ${friendId.slice(-4)}</span>
            </div>
        `).join('');
    }

    // Render mata pelajaran yang dipilih
    renderSubjects(subjects) {
        const subjectsList = document.getElementById('subjectsList');
        if (!subjectsList) return;

        if (!subjects || subjects.length === 0) {
            subjectsList.innerHTML = '<p class="empty-state">Belum memilih mata pelajaran</p>';
            return;
        }

        subjectsList.innerHTML = subjects.map(subject => `
            <span class="subject-badge">${subject}</span>
        `).join('');
    }

    // Render achievements
    renderAchievements(achievements) {
        const achievementsList = document.getElementById('achievementsList');
        if (!achievementsList) return;

        if (!achievements || achievements.length === 0) {
            achievementsList.innerHTML = '<p class="empty-state">Belum ada pencapaian</p>';
            return;
        }

        achievementsList.innerHTML = achievements.map(achievement => `
            <div class="achievement-item">
                <div class="achievement-icon">🏆</div>
                <div class="achievement-info">
                    <h4>${achievement.name}</h4>
                    <small>${this.formatDate(achievement.earnedAt)}</small>
                </div>
            </div>
        `).join('');
    }

    // Update XP progress bar
    updateXPProgress(xp, level) {
        const xpProgress = document.getElementById('xpProgress');
        if (!xpProgress) return;

        const currentLevelXP = (level - 1) * 100;
        const nextLevelXP = level * 100;
        const progress = ((xp - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100;

        xpProgress.style.width = `${progress}%`;
        
        const xpText = document.getElementById('xpText');
        if (xpText) {
            xpText.textContent = `${xp - currentLevelXP} / ${nextLevelXP - currentLevelXP} XP`;
        }
    }

    // Format tanggal
    formatDate(dateString) {
        const date = new Date(dateString);
        const options = { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        };
        return date.toLocaleDateString('id-ID', options);
    }

    // Setup event listeners
    setupEventListeners() {
        // Logout button
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.logout());
        }

        // Edit profile button
        const editProfileBtn = document.getElementById('editProfileBtn');
        if (editProfileBtn) {
            editProfileBtn.addEventListener('click', () => this.showEditProfile());
        }

        // Add XP button (untuk testing)
        const addXPBtn = document.getElementById('addXPBtn');
        if (addXPBtn) {
            addXPBtn.addEventListener('click', () => this.addXP(10));
        }

        // Refresh data button
        const refreshBtn = document.getElementById('refreshBtn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.loadUserData());
        }
    }

    // Logout
    async logout() {
        try {
            await fetch('/api/logout', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                }
            });

            localStorage.removeItem('token');
            window.location.href = '/login';
        } catch (error) {
            console.error('Logout error:', error);
            // Tetap logout meskipun error
            localStorage.removeItem('token');
            window.location.href = '/login';
        }
    }

    // Show edit profile modal/form
    showEditProfile() {
        // Implementasi sesuai dengan UI yang Anda buat
        alert('Fitur edit profile akan segera hadir!');
    }

    // Add XP (untuk testing)
    async addXP(amount) {
        try {
            const response = await fetch('/api/xp/add', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ amount })
            });

            const data = await response.json();

            if (data.success) {
                // Reload data
                await this.loadUserData();
                alert(`Berhasil menambah ${amount} XP!`);
            }
        } catch (error) {
            console.error('Add XP error:', error);
            alert('Gagal menambah XP');
        }
    }

    // Update profile
    async updateProfile(profileData) {
        try {
            const response = await fetch('/api/profile', {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(profileData)
            });

            const data = await response.json();

            if (data.success) {
                this.userData = data.data.user;
                this.renderUserData();
                alert('Profile berhasil diupdate!');
                return true;
            } else {
                alert(data.message || 'Gagal update profile');
                return false;
            }
        } catch (error) {
            console.error('Update profile error:', error);
            alert('Gagal update profile');
            return false;
        }
    }
}

// Initialize dashboard saat DOM ready
document.addEventListener('DOMContentLoaded', () => {
    window.dashboard = new DashboardManager();
});