let attemptId = null;
let resultsData = null;
let kuisId = null;

const params = new URLSearchParams(window.location.search);
attemptId = params.get('attemptId');

document.addEventListener('DOMContentLoaded', async () => {
    if (!attemptId) {
        window.location.href = '/u/games';
        return;
    }
    await loadResults();
});

async function loadResults() {
    try {
        const response = await fetch(`/api/kuis/attempt/${attemptId}/results`, {
            method: 'GET'
        });

        if (!response.ok) {
            throw new Error('Failed to load results');
        }

        const result = await response.json();
        resultsData = result.data;

        // Fetch attempt details to get question/option text mapping
        try {
            const attemptResp = await fetch(`/api/kuis/attempt/${attemptId}`, { method: 'GET' });
            if (attemptResp.ok) {
                const attemptJson = await attemptResp.json();
                // attach questions so we can map option IDs to their display text
                resultsData.questions = attemptJson.data.questions || [];
                kuisId = attemptJson.data.attemptId || null;
            }
        } catch (e) {
            console.warn('Could not fetch attempt details for mapping answers:', e);
        }

        displayResults();
        createConfetti();

    } catch (error) {
        console.error('Error loading results:', error);
        alert('Gagal memuat hasil quiz');
        window.location.href = '/u/games';
    }
}

function displayResults() {
    // Hide loading, show content
    document.getElementById('loadingState').style.display = 'none';
    document.getElementById('resultsContent').classList.remove('hidden');

    // Set grade badge
    const gradeBadge = document.getElementById('gradeBadge');
    gradeBadge.textContent = resultsData.grade;
    gradeBadge.style.background = getGradeColor(resultsData.grade);

    // Set score
    document.getElementById('scoreValue').textContent = resultsData.score;
    document.getElementById('totalScore').textContent = resultsData.totalScore;
    document.getElementById('percentageValue').textContent = resultsData.percentage.toFixed(0);

    // Set quiz info
    document.getElementById('quizTitle').textContent = resultsData.quizTitle;
    document.getElementById('quizSubject').textContent = resultsData.quizSubject;

    // Calculate stats
    const correctCount = resultsData.answers.filter(a => a.isCorrect).length;
    const wrongCount = resultsData.answers.length - correctCount;
    const xpEarned = Math.floor(resultsData.score / 2);

    document.getElementById('correctAnswers').textContent = correctCount;
    document.getElementById('wrongAnswers').textContent = wrongCount;
    document.getElementById('timeSpent').textContent = formatTime(resultsData.timeSpent);
    document.getElementById('xpEarned').textContent = `+${xpEarned}`;

    // Performance message
    const messageText = getPerformanceMessage(resultsData.percentage);
    document.getElementById('messageText').textContent = messageText;

    // Display answers review
    displayAnswersReview();
}

function getGradeColor(grade) {
    switch(grade) {
        case 'A': return 'linear-gradient(135deg, #22c55e, #10b981)';
        case 'B': return 'linear-gradient(135deg, #3b82f6, #2563eb)';
        case 'C': return 'linear-gradient(135deg, #f59e0b, #d97706)';
        case 'D': return 'linear-gradient(135deg, #ef4444, #dc2626)';
        default: return 'linear-gradient(135deg, #6b7280, #4b5563)';
    }
}

function getPerformanceMessage(percentage) {
    if (percentage >= 90) return '🎉 Luar biasa! Kamu sangat menguasai materi ini!';
    if (percentage >= 80) return '👏 Kerja bagus! Kamu memahami sebagian besar materi!';
    if (percentage >= 70) return '👍 Cukup baik! Terus tingkatkan pemahaman kamu!';
    if (percentage >= 60) return '💪 Tidak buruk! Masih ada ruang untuk peningkatan!';
    return '📚 Jangan menyerah! Terus belajar dan coba lagi!';
}

function displayAnswersReview() {
    const container = document.getElementById('answersReview');
    
    if (!resultsData.answers || resultsData.answers.length === 0) {
        container.innerHTML = '<p class="empty">Tidak ada jawaban untuk direview.</p>';
        return;
    }

    container.innerHTML = resultsData.answers.map((answer, idx) => {
        const isCorrect = answer.isCorrect;
        const statusClass = isCorrect ? 'correct' : 'incorrect';
        const statusIcon = isCorrect ? 'fa-check-circle' : 'fa-times-circle';
        const statusText = isCorrect ? 'Benar' : 'Salah';

        // Find question text from attached questions (if available)
        const questionObj = (resultsData.questions || []).find(q => q.id === answer.questionId);
        const questionText = answer.questionText || questionObj?.question || `Soal ${idx + 1}`;

        return `
            <div class="answer-item ${statusClass}">
                <div class="answer-header">
                    <span class="answer-status ${statusClass}">
                        <i class="fas ${statusIcon}"></i>
                        ${statusText}
                    </span>
                    <span class="answer-points">+${answer.pointsEarned || 0} poin</span>
                </div>
                <div class="question-text">
                    ${idx + 1}. ${escapeHtml(questionText)}
                </div>
                <div class="answer-detail">
                    <strong>Jawaban Anda:</strong> ${formatAnswer(answer.selectedAnswers, answer.questionId)}
                </div>
            </div>
        `;
    }).join('');
}

function formatAnswer(answers, questionId) {
    if (!answers || answers.length === 0) return 'Tidak dijawab';

    const questions = resultsData.questions || [];
    const question = questions.find(q => q.id === questionId);

    const mapValue = (val) => {
        // If question not available, return raw value
        if (!question) return val;

        // Matching type: map rightId/leftId to their text
        if (question.type === 'matching' && question.pairs) {
            const pair = question.pairs.find(p => p.rightId === val || p.leftId === val || p.correctMatch === val);
            if (pair) return pair.rightText || pair.leftText || val;
            return val;
        }

        // For multiple choice types, map option id to option text
        if (question.options && question.options.length > 0) {
            const opt = question.options.find(o => o.id === val);
            if (opt) return opt.text;
            return val;
        }

        return val;
    };

    if (answers.length === 1) return escapeHtml(mapValue(answers[0]));
    return answers.map(a => escapeHtml(mapValue(a))).join(', ');
}

function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${String(secs).padStart(2, '0')}`;
}

function createConfetti() {
    const confettiContainer = document.getElementById('confetti');
    const colors = ['#ff9800', '#d97706', '#22c55e', '#f59e0b', '#fb8c00'];
    
    // Only show confetti for good performance
    if (resultsData.percentage < 70) return;

    for (let i = 0; i < 50; i++) {
        setTimeout(() => {
            const confetti = document.createElement('div');
            confetti.style.position = 'absolute';
            confetti.style.width = '10px';
            confetti.style.height = '10px';
            confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            confetti.style.left = Math.random() * 100 + '%';
            confetti.style.top = '-10px';
            confetti.style.opacity = '1';
            confetti.style.transform = `rotate(${Math.random() * 360}deg)`;
            confetti.style.transition = 'all 3s ease-out';
            
            confettiContainer.appendChild(confetti);
            
            setTimeout(() => {
                confetti.style.top = '100%';
                confetti.style.opacity = '0';
                confetti.style.transform = `rotate(${Math.random() * 720}deg)`;
            }, 10);
            
            setTimeout(() => {
                confetti.remove();
            }, 3000);
        }, i * 30);
    }
}

function goToGames() {
    window.location.href = '/u/games';
}

function retakeQuiz() {
    if (kuisId) {
        window.location.href = `/u/games?quiz=${kuisId}`;
    } else {
        window.location.href = '/u/games';
    }
}

function shareResults() {
    const text = `Saya mendapat skor ${resultsData.score}/${resultsData.totalScore} (${resultsData.percentage.toFixed(0)}%) pada quiz ${resultsData.quizTitle}! 🎉`;
    
    if (navigator.share) {
        navigator.share({
            title: 'Hasil Quiz Saya',
            text: text,
            url: window.location.href
        }).catch(() => {
            copyToClipboard(text);
        });
    } else {
        copyToClipboard(text);
    }
}

function copyToClipboard(text) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    
    try {
        document.execCommand('copy');
        alert('Hasil berhasil disalin ke clipboard!');
    } catch (err) {
        alert('Gagal menyalin hasil');
    }
    
    document.body.removeChild(textarea);
}

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