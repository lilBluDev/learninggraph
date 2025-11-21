let currentGame = null;
let currentQuiz = null;
let currentPage = 1;
const quizzesPerPage = 10;

// Initialize games page
document.addEventListener('DOMContentLoaded', async () => {
    loadQuizzes();
});

async function loadQuizzes(page = 1) {
    try {
        const subject = document.getElementById('subjectFilter')?.value || '';
        const url = `/api/kuis/list?page=${page}&limit=${quizzesPerPage}${subject ? `&subject=${subject}` : ''}`;
        
        const response = await fetch(url);
        const result = await response.json();

        if (!result.success) {
            showError('Gagal memuat kuis');
            return;
        }

        const grid = document.getElementById('quizzesGrid');
        grid.innerHTML = result.data.map(quiz => `
            <div class="quiz-card">
                <div class="quiz-header">
                    <div>
                        <div class="quiz-title">${escapeHtml(quiz.title)}</div>
                        <span class="quiz-subject">${quiz.subject}</span>
                    </div>
                </div>
                
                <div class="quiz-stats">
                    <div class="quiz-stat">
                        <i class="fas fa-list"></i>
                        <span>${quiz.questions.length} Soal</span>
                    </div>
                    <div class="quiz-stat">
                        <i class="fas fa-clock"></i>
                        <span>${Math.floor(quiz.duration / 60)} Menit</span>
                    </div>
                    <div class="quiz-stat">
                        <i class="fas fa-star"></i>
                        <span>${quiz.totalPoints} Poin</span>
                    </div>
                </div>

                ${quiz.description ? `<div class="quiz-description">${escapeHtml(quiz.description)}</div>` : ''}

                <div class="quiz-creator">
                    <div class="creator-avatar">${quiz.createdBy.displayName.charAt(0).toUpperCase()}</div>
                    <span>Dibuat oleh ${escapeHtml(quiz.createdBy.displayName)}</span>
                </div>

                <div class="quiz-actions">
                    <button class="btn-start" onclick="selectGame('${quiz._id}')">
                        <i class="fas fa-play"></i> Mulai
                    </button>
                </div>
            </div>
        `).join('');

        // Pagination
        renderPagination(result.pagination);
        currentPage = page;

    } catch (error) {
        console.error('Error loading quizzes:', error);
        showError('Terjadi kesalahan saat memuat kuis');
    }
}

function renderPagination(pagination) {
    const container = document.getElementById('pagination');
    container.innerHTML = '';

    if (pagination.pages <= 1) return;

    // Previous button
    if (pagination.page > 1) {
        const prevBtn = document.createElement('button');
        prevBtn.textContent = '← Sebelumnya';
        prevBtn.onclick = () => loadQuizzes(pagination.page - 1);
        container.appendChild(prevBtn);
    }

    // Page numbers
    for (let i = 1; i <= pagination.pages; i++) {
        const btn = document.createElement('button');
        btn.textContent = i;
        btn.className = i === pagination.page ? 'active' : '';
        btn.onclick = () => loadQuizzes(i);
        container.appendChild(btn);
    }

    // Next button
    if (pagination.page < pagination.pages) {
        const nextBtn = document.createElement('button');
        nextBtn.textContent = 'Selanjutnya →';
        nextBtn.onclick = () => loadQuizzes(pagination.page + 1);
        container.appendChild(nextBtn);
    }
}

function filterQuizzes() {
    loadQuizzes(1);
}

function openGame(game) {
    currentGame = game;
    // Implementasi game lain bisa ditambahkan di sini
    if (game !== 'quiz-battle' && game !== 'quick-quiz') {
        showError('Game ini belum tersedia');
        return;
    }
}

function selectGame(quizId) {
    currentQuiz = quizId;
    const modeModal = document.getElementById('modeModal');
    modeModal.classList.remove('hidden');
}

function closeModeModal() {
    const modeModal = document.getElementById('modeModal');
    modeModal.classList.add('hidden');
}

async function startSoloMode() {
    try {
        closeModeModal();
        
        const response = await fetch(`/api/kuis/attempt/start/${currentQuiz}`, {
            method: 'POST'
        });

        const result = await response.json();
        if (!result.success) {
            showError(result.message);
            return;
        }

        // Redirect to quiz player
        window.location.href = `/u/quiz?attemptId=${result.data.attemptId}&mode=solo`;
    } catch (error) {
        console.error('Error starting solo mode:', error);
        showError('Gagal memulai mode solo');
    }
}

async function startMatchMode() {
    try {
        closeModeModal();
        
        // First, try to find waiting match
        const matchResponse = await fetch(`/api/kuis/match/waiting/${currentQuiz}`, {
            method: 'GET'
        }).catch(() => null);

        if (matchResponse?.ok) {
            const matchResult = await matchResponse.json();
            if (matchResult.success && matchResult.data) {
                // Join existing match
                const joinResponse = await fetch(`/api/kuis/match/join/${matchResult.data.matchId}`, {
                    method: 'POST'
                });
                const joinResult = await joinResponse.json();
                if (joinResult.success) {
                    window.location.href = `/u/quiz?attemptId=${joinResult.data.attemptId}&mode=match&matchId=${joinResult.data.matchId}`;
                    return;
                }
            }
        }

        // Create new match if none found
        const createResponse = await fetch(`/api/kuis/match/create/${currentQuiz}`, {
            method: 'POST'
        });

        const createResult = await createResponse.json();
        if (!createResult.success) {
            showError(createResult.message);
            return;
        }

        // Redirect to waiting room
        window.location.href = `/u/quiz-match-waiting?matchId=${createResult.data.matchId}`;
    } catch (error) {
        console.error('Error starting match mode:', error);
        showError('Gagal memulai mode match');
    }
}

// Utility functions
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

function showError(message) {
    // You can implement a better error notification here
    alert(message);
}

function showSuccess(message) {
    // You can implement a better success notification here
    console.log('Success:', message);
}