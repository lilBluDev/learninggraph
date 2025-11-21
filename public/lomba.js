// State
let lombas = [];
let filteredLombas = [];
let currentFilters = {
    category: 'all',
    status: 'all',
    search: ''
};

// API Functions
const API = {
    async getLombas() {
        try {
            const response = await fetch(`/api/lombas`);
            if (!response.ok) throw new Error('Failed to fetch lombas');
            return await response.json();
        } catch (error) {
            console.error('Error fetching lombas:', error);
            return [];
        }
    },

    async getLomba(id) {
        try {
            const response = await fetch(`/api/lombas/${id}`);
            if (!response.ok) throw new Error('Failed to fetch lomba');
            return await response.json();
        } catch (error) {
            console.error('Error fetching lomba:', error);
            return null;
        }
    },

    async createLomba(lombaData) {
        try {
            console.log('Sending lomba data:', lombaData);
            const response = await fetch(`/api/lombas`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(lombaData)
            });
            
            const result = await response.json();
            console.log('Response:', result);
            
            if (!response.ok) {
                throw new Error(result.message || 'Failed to create lomba');
            }
            
            return result;
        } catch (error) {
            console.error('Error creating lomba:', error);
            throw error;
        }
    },

    async updateLomba(id, lombaData) {
        try {
            const response = await fetch(`/api/lombas/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(lombaData)
            });
            if (!response.ok) throw new Error('Failed to update lomba');
            return await response.json();
        } catch (error) {
            console.error('Error updating lomba:', error);
            throw error;
        }
    },

    async deleteLomba(id) {
        try {
            const response = await fetch(`/api/lombas/${id}`, {
                method: 'DELETE'
            });
            if (!response.ok) throw new Error('Failed to delete lomba');
            return await response.json();
        } catch (error) {
            console.error('Error deleting lomba:', error);
            throw error;
        }
    }
};

// Load Lombas
async function loadLombas() {
    try {
        lombas = await API.getLombas();
        filterLomba();
    } catch (error) {
        console.error('Error loading lombas:', error);
    }
}

// Filter Lomba
function filterLomba() {
    const categoryFilter = document.getElementById('categoryFilter')?.value || 'all';
    const statusFilter = document.getElementById('statusFilter')?.value || 'all';
    const searchQuery = document.getElementById('searchInput')?.value?.toLowerCase() || '';

    currentFilters = {
        category: categoryFilter,
        status: statusFilter,
        search: searchQuery
    };

    filteredLombas = lombas.filter(lomba => {
        // Filter by status (approved only, unless viewing pending)
        if (lomba.status === 'pending' && statusFilter !== 'pending') {
            return false;
        }
        
        if (lomba.status !== 'approved' && lomba.status !== 'pending') {
            return false;
        }

        // Filter by category
        if (categoryFilter !== 'all' && lomba.category !== categoryFilter) {
            return false;
        }

        // Filter by deadline status
        if (statusFilter !== 'all') {
            const deadlineStatus = getDeadlineStatus(lomba.deadline);
            if (statusFilter !== deadlineStatus && statusFilter !== 'pending') {
                return false;
            }
        }

        // Filter by search
        if (searchQuery) {
            const searchableText = `${lomba.title} ${lomba.organizer} ${lomba.description}`.toLowerCase();
            if (!searchableText.includes(searchQuery)) {
                return false;
            }
        }

        return true;
    });

    renderLombas();
}

// Get deadline status
function getDeadlineStatus(deadline) {
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const diffTime = deadlineDate - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return 'closed';
    if (diffDays <= 7) return 'closing-soon';
    return 'open';
}

// Format deadline text
function formatDeadline(deadline) {
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const diffTime = deadlineDate - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
        return 'Sudah Ditutup';
    } else if (diffDays === 0) {
        return 'Tutup Hari Ini!';
    } else if (diffDays <= 7) {
        return `Tutup ${diffDays} hari lagi!`;
    } else {
        const options = { day: 'numeric', month: 'long', year: 'numeric' };
        return `Deadline: ${deadlineDate.toLocaleDateString('id-ID', options)}`;
    }
}

// Render Lombas
function renderLombas() {
    const grid = document.getElementById('lombaGrid');
    const emptyState = document.getElementById('emptyState');

    if (!grid || !emptyState) return;

    if (filteredLombas.length === 0) {
        grid.style.display = 'none';
        emptyState.style.display = 'block';
        return;
    }

    grid.style.display = 'grid';
    emptyState.style.display = 'none';

    grid.innerHTML = filteredLombas.map(lomba => {
        const deadlineStatus = getDeadlineStatus(lomba.deadline);
        const isPending = lomba.status === 'pending';
        
        return `
            <div class="lomba-card ${isPending ? 'pending' : ''}" onclick="openDetailModal('${lomba._id}')">
                ${lomba.poster ? 
                    `<img src="${lomba.poster}" alt="${lomba.title}" class="lomba-poster">` :
                    `<div class="lomba-poster no-image"><i class="fas fa-trophy"></i></div>`
                }
                <div class="lomba-content">
                    <div class="lomba-header">
                        <span class="lomba-category ${lomba.category}">${getCategoryLabel(lomba.category)}</span>
                        <h3 class="lomba-title">${lomba.title}</h3>
                        <div class="lomba-organizer">
                            <i class="fas fa-building"></i>
                            <span>${lomba.organizer}</span>
                        </div>
                    </div>
                    <div class="lomba-info">
                        <div class="info-item">
                            <i class="fas fa-layer-group"></i>
                            <span>${getLevelLabel(lomba.level)}</span>
                        </div>
                        ${lomba.prize ? `
                            <div class="info-item">
                                <i class="fas fa-gift"></i>
                                <span>${lomba.prize}</span>
                            </div>
                        ` : ''}
                    </div>
                    <div class="lomba-deadline ${deadlineStatus === 'closing-soon' ? 'closing-soon' : ''}">
                        <i class="fas fa-clock"></i> ${formatDeadline(lomba.deadline)}
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// Get category label
function getCategoryLabel(category) {
    const labels = {
        'akademik': 'Akademik',
        'teknologi': 'Teknologi',
        'seni': 'Seni & Desain',
        'olahraga': 'Olahraga',
        'bisnis': 'Bisnis',
        'lainnya': 'Lainnya'
    };
    return labels[category] || category;
}

// Get level label
function getLevelLabel(level) {
    const labels = {
        'sekolah': 'Tingkat Sekolah',
        'regional': 'Tingkat Regional',
        'nasional': 'Tingkat Nasional',
        'internasional': 'Tingkat Internasional'
    };
    return labels[level] || level;
}

// Open Detail Modal
async function openDetailModal(lombaId) {
    const lomba = await API.getLomba(lombaId);
    if (!lomba) return;

    const modal = document.getElementById('detailModal');
    const content = document.getElementById('modalDetailContent');
    
    if (!modal || !content) return;
    
    const deadlineStatus = getDeadlineStatus(lomba.deadline);

    content.innerHTML = `
        <div class="detail-grid">
            <div>
                ${lomba.poster ? 
                    `<div class="detail-poster"><img src="${lomba.poster}" alt="${lomba.title}"></div>` :
                    `<div class="detail-poster no-image"><i class="fas fa-trophy"></i></div>`
                }
            </div>
            <div class="detail-info">
                <h3>${lomba.title}</h3>
                <div class="detail-meta">
                    <span class="meta-badge lomba-category ${lomba.category}">${getCategoryLabel(lomba.category)}</span>
                    <span class="meta-badge" style="background: #e9ecef; color: #495057;">${getLevelLabel(lomba.level)}</span>
                    ${lomba.status === 'pending' ? '<span class="meta-badge" style="background: #ffc107; color: white;">Pending Review</span>' : ''}
                </div>
                
                <div class="detail-section">
                    <h4><i class="fas fa-align-left"></i> Deskripsi</h4>
                    <p>${lomba.description}</p>
                </div>

                <div class="detail-section">
                    <h4><i class="fas fa-info-circle"></i> Informasi Lomba</h4>
                    <div class="info-grid">
                        <div class="info-row">
                            <i class="fas fa-building"></i>
                            <strong>Penyelenggara:</strong>
                            <span>${lomba.organizer}</span>
                        </div>
                        <div class="info-row">
                            <i class="fas fa-calendar-alt"></i>
                            <strong>Deadline:</strong>
                            <span>${new Date(lomba.deadline).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                        </div>
                        ${lomba.prize ? `
                            <div class="info-row">
                                <i class="fas fa-trophy"></i>
                                <strong>Hadiah:</strong>
                                <span>${lomba.prize}</span>
                            </div>
                        ` : ''}
                        <div class="info-row">
                            <i class="fas fa-phone"></i>
                            <strong>Kontak:</strong>
                            <span>${lomba.contact}</span>
                        </div>
                    </div>
                </div>

                <div class="detail-actions">
                    ${deadlineStatus !== 'closed' ? `
                        <a href="${lomba.registrationLink}" target="_blank" class="btn btn-primary">
                            <i class="fas fa-external-link-alt"></i> Daftar Sekarang
                        </a>
                    ` : ''}
                    <button class="btn btn-outline" onclick="closeDetailModal()">
                        <i class="fas fa-times"></i> Tutup
                    </button>
                </div>
            </div>
        </div>
    `;

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

// Close Detail Modal
function closeDetailModal() {
    const modal = document.getElementById('detailModal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = 'auto';
    }
}

// Open Submit Modal
function openSubmitModal() {
    const modal = document.getElementById('submitModal');
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

// Close Submit Modal
function closeSubmitModal() {
    const modal = document.getElementById('submitModal');
    const form = document.getElementById('submitLombaForm');
    const preview = document.getElementById('posterPreview');
    
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = 'auto';
    }
    
    if (form) form.reset();
    if (preview) preview.innerHTML = '';
}

// Preview Poster
function previewPoster(event) {
    const file = event.target.files[0];
    const preview = document.getElementById('posterPreview');

    if (!preview) return;

    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            preview.innerHTML = `<img src="${e.target.result}" alt="Preview">`;
        };
        reader.readAsDataURL(file);
    } else {
        preview.innerHTML = '';
    }
}

// Submit Lomba Form
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM Loaded - Initializing lomba.js');
    
    loadLombas();

    const submitForm = document.getElementById('submitLombaForm');
    
    if (submitForm) {
        console.log('Submit form found');
        
        submitForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            console.log('Form submitted!');

            try {
                // Get poster data
                const posterInput = document.getElementById('lombaPoster');
                let posterData = null;

                if (posterInput && posterInput.files && posterInput.files[0]) {
                    console.log('Reading poster file...');
                    posterData = await new Promise((resolve) => {
                        const reader = new FileReader();
                        reader.onload = (e) => {
                            console.log('Poster file read successfully');
                            resolve(e.target.result);
                        };
                        reader.readAsDataURL(posterInput.files[0]);
                    });
                }

                const lombaData = {
                    title: document.getElementById('lombaTitle').value,
                    category: document.getElementById('lombaCategory').value,
                    level: document.getElementById('lombaLevel').value,
                    deadline: document.getElementById('lombaDeadline').value,
                    organizer: document.getElementById('lombaOrganizer').value,
                    description: document.getElementById('lombaDescription').value,
                    prize: document.getElementById('lombaPrize').value,
                    contact: document.getElementById('lombaContact').value,
                    registrationLink: document.getElementById('lombaLink').value,
                    poster: posterData,
                    status: 'pending'
                };

                console.log('Submitting lomba:', lombaData);

                const result = await API.createLomba(lombaData);
                
                console.log('Lomba created:', result);
                
                closeSubmitModal();
                alert('Lomba berhasil disubmit! Menunggu review dari admin.');
                await loadLombas();
                
            } catch (error) {
                console.error('Submit error:', error);
                alert('Gagal submit lomba: ' + error.message);
            }
        });
    } else {
        console.error('Submit form not found!');
    }

    // Setup filter listeners
    const categoryFilter = document.getElementById('categoryFilter');
    const statusFilter = document.getElementById('statusFilter');
    const searchInput = document.getElementById('searchInput');

    if (categoryFilter) categoryFilter.addEventListener('change', filterLomba);
    if (statusFilter) statusFilter.addEventListener('change', filterLomba);
    if (searchInput) searchInput.addEventListener('input', filterLomba);

    // Close modal when clicking outside
    window.onclick = function(event) {
        const detailModal = document.getElementById('detailModal');
        const submitModal = document.getElementById('submitModal');
        
        if (event.target === detailModal) {
            closeDetailModal();
        }
        if (event.target === submitModal) {
            closeSubmitModal();
        }
    };
});