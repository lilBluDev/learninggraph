let currentTab = 'overview';
let usersPage = 1;
let quizzesPage = 1;
const itemsPerPage = 10;
let allUsers = [];
let allQuizzes = [];
let currentQuestion = null;
let currentQuestionIndex = null;
let quizQuestions = [];
let uploadedImageUrl = null;

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    await loadDashboard();
});

async function loadDashboard() {
    try {
        const userResponse = await fetch('/api/user');
        const userData = await userResponse.json();
        
        if (!userData.success || userData.data.role !== 'ADMIN') {
            window.location.href = '/u';
            return;
        }

        document.getElementById('adminName').textContent = userData.data.displayName;
        
        await loadOverviewStats();
        await loadUsers();
        await loadQuizzes();
    } catch (error) {
        console.error('Error loading dashboard:', error);
        showError('Gagal memuat dashboard');
    }
}

async function loadOverviewStats() {
    try {
        const response = await fetch('/api/admin/stats');
        const result = await response.json();

        if (result.success) {
            document.getElementById('totalUsers').textContent = result.data.totalUsers;
            document.getElementById('totalQuizzes').textContent = result.data.totalQuizzes;
            document.getElementById('totalAttempts').textContent = result.data.totalAttempts;
            document.getElementById('totalMatches').textContent = result.data.totalMatches;

            // Recent users
            const recentUsersHtml = result.data.recentUsers.map(user => `
                <div class="recent-item">
                    <div class="recent-item-info">
                        <div class="recent-item-name">${escapeHtml(user.displayName)}</div>
                        <div class="recent-item-meta">@${escapeHtml(user.username)}</div>
                    </div>
                    <div class="recent-item-meta">${formatDate(user.createdAt)}</div>
                </div>
            `).join('');
            document.getElementById('recentUsers').innerHTML = recentUsersHtml;

            // Recent quizzes
            const recentQuizzesHtml = result.data.recentQuizzes.map(quiz => `
                <div class="recent-item">
                    <div class="recent-item-info">
                        <div class="recent-item-name">${escapeHtml(quiz.title)}</div>
                        <div class="recent-item-meta">${quiz.subject} • ${quiz.questions.length} soal</div>
                    </div>
                </div>
            `).join('');
            document.getElementById('recentQuizzes').innerHTML = recentQuizzesHtml;
        }
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

async function loadUsers(page = 1) {
    try {
        const response = await fetch(`/api/admin/users?page=${page}&limit=${itemsPerPage}`);
        const result = await response.json();

        if (result.success) {
            allUsers = result.data;
            renderUsersTable(result.data);
            renderPagination('usersPagination', result.pagination, (p) => loadUsers(p));
            usersPage = page;
        }
    } catch (error) {
        console.error('Error loading users:', error);
        showError('Gagal memuat daftar user');
    }
}

function renderUsersTable(users) {
    const tbody = document.getElementById('usersTableBody');
    
    if (users.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="empty-state">Tidak ada user ditemukan</td></tr>';
        return;
    }

    tbody.innerHTML = users.map(user => `
        <tr>
            <td><strong>@${escapeHtml(user.username)}</strong></td>
            <td>${escapeHtml(user.email)}</td>
            <td>${escapeHtml(user.displayName)}</td>
            <td><span class="role-badge ${user.role.toLowerCase()}">${user.role}</span></td>
            <td><strong>Level ${user.level}</strong></td>
            <td>${formatDate(user.createdAt)}</td>
            <td>
                <div class="table-actions">
                    <button class="btn-icon view" onclick="viewUserDetail('${user._id}')" title="Lihat">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn-icon edit" onclick="editUser('${user._id}')" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-icon delete" onclick="deleteUser('${user._id}')" title="Hapus">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

async function viewUserDetail(userId) {
    try {
        const response = await fetch(`/api/admin/users/${userId}`);
        const result = await response.json();

        if (result.success) {
            const user = result.data;
            const modal = document.getElementById('userModal');
            const content = document.getElementById('userModalContent');

            content.innerHTML = `
                <div style="padding: 1rem 0;">
                    <div style="margin-bottom: 1.5rem;">
                        <h4>Informasi Dasar</h4>
                        <p><strong>Username:</strong> ${escapeHtml(user.username)}</p>
                        <p><strong>Email:</strong> ${escapeHtml(user.email)}</p>
                        <p><strong>Nama:</strong> ${escapeHtml(user.displayName)}</p>
                        <p><strong>Role:</strong> ${user.role}</p>
                    </div>

                    <div style="margin-bottom: 1.5rem;">
                        <h4>Statistik</h4>
                        <p><strong>Level:</strong> ${user.level}</p>
                        <p><strong>XP:</strong> ${user.xp}</p>
                        <p><strong>Teman:</strong> ${user.friends.length}</p>
                        <p><strong>Mata Pelajaran:</strong> ${user.selectedSubjects.join(', ') || '-'}</p>
                    </div>

                    <div style="margin-bottom: 1.5rem;">
                        <h4>Tanggal</h4>
                        <p><strong>Bergabung:</strong> ${formatDate(user.createdAt)}</p>
                        <p><strong>Last Login:</strong> ${formatDate(user.lastLogin)}</p>
                    </div>

                    <div class="modal-actions">
                        <button class="btn-secondary" onclick="closeUserModal()">Tutup</button>
                        <button class="btn-primary" onclick="promoteToAdmin('${user._id}')">
                            Jadikan Admin
                        </button>
                    </div>
                </div>
            `;

            modal.classList.remove('hidden');
        }
    } catch (error) {
        showError('Gagal memuat detail user');
    }
}

function closeUserModal() {
    document.getElementById('userModal').classList.add('hidden');
}

async function editUser(userId) {
    // Bisa implement edit modal di sini
    alert('Edit user akan diimplementasikan');
}

async function deleteUser(userId) {
    if (!confirm('Yakin ingin menghapus user ini?')) return;

    try {
        const response = await fetch(`/api/admin/users/${userId}`, {
            method: 'DELETE'
        });

        const result = await response.json();

        if (result.success) {
            showSuccess('User berhasil dihapus');
            loadUsers(usersPage);
        } else {
            showError(result.message);
        }
    } catch (error) {
        showError('Gagal menghapus user');
    }
}

async function promoteToAdmin(userId) {
    if (!confirm('Jadikan user ini sebagai admin?')) return;

    try {
        const response = await fetch(`/api/admin/users/${userId}/promote`, {
            method: 'POST'
        });

        const result = await response.json();

        if (result.success) {
            showSuccess('User berhasil dipromosikan menjadi admin');
            closeUserModal();
            loadUsers(usersPage);
        } else {
            showError(result.message);
        }
    } catch (error) {
        showError('Gagal mempromosikan user');
    }
}

function searchUsers() {
    const query = document.getElementById('userSearch').value.toLowerCase();
    const filtered = allUsers.filter(user =>
        user.username.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query) ||
        user.displayName.toLowerCase().includes(query)
    );

    renderUsersTable(filtered);
}

// Quiz Builder
async function loadQuizzes(page = 1) {
    try {
        const response = await fetch(`/api/admin/quizzes?page=${page}&limit=${itemsPerPage}`);
        const result = await response.json();

        if (result.success) {
            allQuizzes = result.data;
            renderQuizzesTable(result.data);
            renderPagination('quizzesPagination', result.pagination, (p) => loadQuizzes(p));
            quizzesPage = page;
        }
    } catch (error) {
        console.error('Error loading quizzes:', error);
    }
}

function renderQuizzesTable(quizzes) {
    const tbody = document.getElementById('quizzesTableBody');

    if (quizzes.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="empty-state">Tidak ada kuis ditemukan</td></tr>';
        return;
    }

    tbody.innerHTML = quizzes.map(quiz => `
        <tr>
            <td><strong>${escapeHtml(quiz.title)}</strong></td>
            <td>${quiz.subject}</td>
            <td>${quiz.questions.length}</td>
            <td>${Math.floor(quiz.duration / 60)} menit</td>
            <td>${quiz.attempts}</td>
            <td>${formatDate(quiz.createdAt)}</td>
            <td>
                <span class="status-badge ${quiz.isPublished ? 'published' : 'draft'}">
                    ${quiz.isPublished ? 'Dipublikasi' : 'Draft'}
                </span>
            </td>
            <td>
                <div class="table-actions">
                    <button class="btn-icon edit" onclick="editQuiz('${quiz._id}')" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-icon view" onclick="togglePublish('${quiz._id}', ${quiz.isPublished})" title="Toggle">
                        <i class="fas fa-${quiz.isPublished ? 'eye-slash' : 'eye'}"></i>
                    </button>
                    <button class="btn-icon delete" onclick="deleteQuiz('${quiz._id}')" title="Hapus">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

function searchQuizzes() {
    const query = document.getElementById('quizSearch').value.toLowerCase();
    const filtered = allQuizzes.filter(quiz =>
        quiz.title.toLowerCase().includes(query) ||
        quiz.subject.toLowerCase().includes(query)
    );

    renderQuizzesTable(filtered);
}

function addNewQuestion() {
    currentQuestion = null;
    currentQuestionIndex = null;
    uploadedImageUrl = null;
    resetQuestionForm();
    document.getElementById('questionModalTitle').textContent = 'Tambah Soal Baru';
    document.getElementById('questionModal').classList.remove('hidden');
}

function saveQuestion(e) {
    e.preventDefault();

    const type = document.getElementById('questionType').value;
    const text = document.getElementById('questionText').value;
    const points = parseInt(document.getElementById('questionPoints').value);

    if (!type || !text) {
        showError('Tipe soal dan pertanyaan wajib diisi');
        return;
    }

    const question = {
        id: currentQuestion?.id || `q_${Date.now()}`,
        type,
        question: text,
        image: uploadedImageUrl,
        points,
        options: [],
        pairs: []
    };

    // Collect options
    if (type === 'multiple_choice' || type === 'multiple_complex') {
        const options = [];
        document.querySelectorAll('.option-item').forEach(item => {
            const text = item.querySelector('input[type="text"]').value;
            const isCorrect = item.querySelector('input[type="checkbox"]').checked;
            if (text) {
                options.push({
                    id: `opt_${Date.now()}_${options.length}`,
                    text,
                    isCorrect
                });
            }
        });

        if (options.length < 2) {
            showError('Minimal 2 opsi jawaban diperlukan');
            return;
        }

        if (type === 'multiple_choice' && options.filter(o => o.isCorrect).length !== 1) {
            showError('Pilihan ganda harus punya 1 jawaban benar');
            return;
        }

        question.options = options;
    } else if (type === 'matching') {
        const pairs = [];
        document.querySelectorAll('.pair-item').forEach(item => {
            const left = item.querySelector('input[placeholder*="Pilihan"]').value;
            const right = item.querySelector('input[placeholder*="cocok"]').value;
            const match = item.querySelector('input[placeholder*="Match"]').value;
            if (left && right && match) {
                pairs.push({
                    leftId: `left_${Date.now()}_${pairs.length}`,
                    leftText: left,
                    rightId: `right_${Date.now()}_${pairs.length}`,
                    rightText: right,
                    correctMatch: match
                });
            }
        });

        if (pairs.length < 2) {
            showError('Minimal 2 pasangan diperlukan');
            return;
        }

        question.pairs = pairs;
    }

    // Add or update question
    if (currentQuestionIndex !== null) {
        quizQuestions[currentQuestionIndex] = question;
    } else {
        quizQuestions.push(question);
    }

    renderQuestionsList();
    closeQuestionModal();
}

function editQuiz(quizId) {
    // Bisa implement edit quiz modal
    alert('Edit kuis akan diimplementasikan');
}

async function togglePublish(quizId, currentStatus) {
    try {
        const response = await fetch(`/api/kuis/publish/${quizId}`, {
            method: 'POST'
        });

        const result = await response.json();

        if (result.success) {
            showSuccess(`Kuis berhasil di${!currentStatus ? 'publish' : 'unpublish'}`);
            loadQuizzes(quizzesPage);
        } else {
            showError(result.message);
        }
    } catch (error) {
        showError('Gagal mengubah status kuis');
    }
}

async function deleteQuiz(quizId) {
    if (!confirm('Yakin ingin menghapus kuis ini?')) return;

    try {
        const response = await fetch(`/api/admin/quizzes/${quizId}`, {
            method: 'DELETE'
        });

        const result = await response.json();

        if (result.success) {
            showSuccess('Kuis berhasil dihapus');
            loadQuizzes(quizzesPage);
        } else {
            showError(result.message);
        }
    } catch (error) {
        showError('Gagal menghapus kuis');
    }
}

function renderQuestionsList() {
    const container = document.getElementById('questionsList');

    if (quizQuestions.length === 0) {
        container.innerHTML = '<p class="empty-state">Belum ada soal. Klik tombol di atas untuk menambah.</p>';
        return;
    }

    container.innerHTML = quizQuestions.map((q, idx) => `
        <div class="question-item">
            <div class="question-preview">
                <div class="question-preview-title">Soal ${idx + 1}: ${escapeHtml(q.question.substring(0, 50))}...</div>
                <div class="question-preview-meta">
                    Tipe: ${q.type} • Poin: ${q.points} • ${q.options?.length || q.pairs?.length || 0} pilihan
                </div>
            </div>
            <div class="question-item-actions">
                <button class="btn-icon edit" onclick="editQuestion(${idx})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-icon delete" onclick="deleteQuestion(${idx})">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
}

function editQuestion(index) {
    currentQuestion = quizQuestions[index];
    currentQuestionIndex = index;
    uploadedImageUrl = currentQuestion.image;

    document.getElementById('questionType').value = currentQuestion.type;
    document.getElementById('questionText').value = currentQuestion.question;
    document.getElementById('questionPoints').value = currentQuestion.points;

    if (currentQuestion.image) {
        document.getElementById('previewImg').src = currentQuestion.image;
        document.getElementById('imagePreview').classList.remove('hidden');
    }

    updateQuestionTypeOptions();
    document.getElementById('questionModalTitle').textContent = 'Edit Soal';
    document.getElementById('questionModal').classList.remove('hidden');
}

function deleteQuestion(index) {
    if (confirm('Hapus soal ini?')) {
        quizQuestions.splice(index, 1);
        renderQuestionsList();
    }
}

function updateQuestionTypeOptions() {
    const type = document.getElementById('questionType').value;
    const optionsContainer = document.getElementById('optionsContainer');
    const pairsContainer = document.getElementById('pairsContainer');

    optionsContainer.classList.add('hidden');
    pairsContainer.classList.add('hidden');

    if (type === 'multiple_choice' || type === 'multiple_complex') {
        optionsContainer.classList.remove('hidden');
        renderOptionsList();
    } else if (type === 'matching') {
        pairsContainer.classList.remove('hidden');
        renderPairsList();
    }
}

function renderOptionsList() {
    const container = document.getElementById('optionsList');
    const options = currentQuestion?.options || [{ text: '', isCorrect: false }];

    container.innerHTML = options.map((opt, idx) => `
        <div class="option-item">
            <input type="text" placeholder="Opsi jawaban" value="${escapeHtml(opt.text || '')}" 
                onchange="updateOption(${idx}, this.value, 'text')">
            <input type="checkbox" ${opt.isCorrect ? 'checked' : ''} 
                onchange="updateOption(${idx}, this.checked, 'correct')">
            <button type="button" onclick="removeOption(${idx})" class="btn-icon delete">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `).join('');
}

function renderPairsList() {
    const container = document.getElementById('pairsList');
    const pairs = currentQuestion?.pairs || [{ leftText: '', rightText: '', correctMatch: '' }];

    container.innerHTML = pairs.map((pair, idx) => `
        <div class="pair-item">
            <input type="text" placeholder="Pilihan A" value="${escapeHtml(pair.leftText || '')}">
            <input type="text" placeholder="cocok dengan" value="${escapeHtml(pair.rightText || '')}">
            <input type="text" placeholder="Match ID" value="${escapeHtml(pair.correctMatch || '')}">
            <button type="button" onclick="removePair(${idx})" class="btn-icon delete">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `).join('');
}

function addOption() {
    if (!currentQuestion) currentQuestion = {};
    if (!currentQuestion.options) currentQuestion.options = [];
    currentQuestion.options.push({ text: '', isCorrect: false });
    renderOptionsList();
}

function updateOption(idx, value, field) {
    if (!currentQuestion) currentQuestion = {};
    if (!currentQuestion.options) currentQuestion.options = [];
    if (field === 'text') currentQuestion.options[idx].text = value;
    else currentQuestion.options[idx].isCorrect = value;
}

function removeOption(idx) {
    currentQuestion.options.splice(idx, 1);
    renderOptionsList();
}

function addPair() {
    if (!currentQuestion) currentQuestion = {};
    if (!currentQuestion.pairs) currentQuestion.pairs = [];
    currentQuestion.pairs.push({ leftText: '', rightText: '', correctMatch: '' });
    renderPairsList();
}

function removePair(idx) {
    currentQuestion.pairs.splice(idx, 1);
    renderPairsList();
}

function removeImage() {
    uploadedImageUrl = null;
    document.getElementById('questionImage').value = '';
    document.getElementById('imagePreview').classList.add('hidden');
}

async function saveQuiz() {
    const title = document.getElementById('quizTitle').value;
    const subject = document.getElementById('quizSubject').value;
    const duration = parseInt(document.getElementById('quizDuration').value) * 60;
    const description = document.getElementById('quizDescription').value;

    if (!title || !subject || !duration || quizQuestions.length === 0) {
        showError('Lengkapi semua field dan minimal 1 soal diperlukan');
        return;
    }

    try {
        const response = await fetch('/api/kuis/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                title,
                subject,
                duration,
                description,
                questions: quizQuestions
            })
        });

        const result = await response.json();

        if (result.success) {
            showSuccess('Kuis berhasil dibuat!');
            resetQuizForm();
            switchTab('published-quizzes');
            loadQuizzes();
        } else {
            showError(result.message);
        }
    } catch (error) {
        console.error('Error saving quiz:', error);
        showError('Gagal menyimpan kuis');
    }
}

function resetQuizForm() {
    document.getElementById('quizTitle').value = '';
    document.getElementById('quizSubject').value = '';
    document.getElementById('quizDuration').value = '';
    document.getElementById('quizDescription').value = '';
    quizQuestions = [];
    currentQuestion = null;
    uploadedImageUrl = null;
    renderQuestionsList();
}

function closeQuestionModal() {
    document.getElementById('questionModal').classList.add('hidden');
    resetQuestionForm();
}

function resetQuestionForm() {
    document.getElementById('questionForm').reset();
    document.getElementById('optionsContainer').classList.add('hidden');
    document.getElementById('pairsContainer').classList.add('hidden');
}

// Tab Switching
function switchTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });

    // Remove active from nav items
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });

    // Show selected tab
    document.getElementById(tabName).classList.add('active');

    // Add active to nav item
    document.querySelector(`[onclick*="${tabName}"]`).classList.add('active');

    // Update header
    const titles = {
        'overview': 'Dashboard Overview',
        'users': 'Penanganan User',
        'quiz-builder': 'Pembuatan Kuis',
        'published-quizzes': 'Kuis Terpublikasi',
        'settings': 'Pengaturan'
    };

    document.getElementById('pageTitle').textContent = titles[tabName];
    document.getElementById('pageSubtitle').textContent = 'Kelola platform LearningGraph';

    currentTab = tabName;
}

function renderPagination(elementId, pagination, callback) {
    const container = document.getElementById(elementId);
    container.innerHTML = '';

    if (pagination.pages <= 1) return;

    if (pagination.page > 1) {
        const btn = document.createElement('button');
        btn.textContent = '← Sebelumnya';
        btn.onclick = () => callback(pagination.page - 1);
        container.appendChild(btn);
    }

    for (let i = 1; i <= pagination.pages; i++) {
        const btn = document.createElement('button');
        btn.textContent = i;
        btn.className = i === pagination.page ? 'active' : '';
        btn.onclick = () => callback(i);
        container.appendChild(btn);
    }

    if (pagination.page < pagination.pages) {
        const btn = document.createElement('button');
        btn.textContent = 'Selanjutnya →';
        btn.onclick = () => callback(pagination.page + 1);
        container.appendChild(btn);
    }
}

async function logoutAdmin() {
    try {
        await fetch('/api/logout', { method: 'POST' });
        window.location.href = '/daftarlogin';
    } catch (error) {
        showError('Gagal logout');
    }
}

// Utility Functions
function escapeHtml(text) {
    if (!text) return '';
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('id-ID', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function showError(message) {
    alert(message); // Bisa implement toast notification
}

function showSuccess(message) {
    alert(message); // Bisa implement toast notification
}