let attemptId = null;
let matchId = null;
let mode = 'solo';
let quiz = null;
let currentQuestionIndex = 0;
let timeLeft = 0;
let timerInterval = null;
let startTime = null;
let answers = {};

// Get query parameters
const params = new URLSearchParams(window.location.search);
attemptId = params.get('attemptId');
matchId = params.get('matchId');
mode = params.get('mode') || 'solo';

document.addEventListener('DOMContentLoaded', async () => {
    if (!attemptId) {
        window.location.href = '/u/games';
        return;
    }
    await loadQuiz();
    startTimer();
});

async function loadQuiz() {
    try {
        const response = await fetch(`/api/kuis/attempt/${attemptId}`, {
            method: 'GET'
        });

        if (!response.ok) {
            throw new Error('Failed to load quiz');
        }

        const result = await response.json();
        quiz = result.data;

        // Set duration
        timeLeft = quiz.duration;

        // Update header
        document.getElementById('quizTitle').textContent = quiz.kuisTitle;
        document.getElementById('quizSubject').textContent = quiz.kuisSubject;
        document.getElementById('progressText').textContent = `1 / ${quiz.questions.length}`;

        // Initialize answers object
        quiz.questions.forEach(q => {
            answers[q.id] = [];
        });

        renderQuestion();
        renderQuestionSelector();

    } catch (error) {
        console.error('Error loading quiz:', error);
        alert('Gagal memuat kuis');
        window.location.href = '/u/games';
    }
}

function renderQuestion() {
    const question = quiz.questions[currentQuestionIndex];
    const container = document.getElementById('questionContainer');

    let html = `
        <div class="question-number">Soal ${currentQuestionIndex + 1} dari ${quiz.questions.length}</div>
        <div class="question-text">${escapeHtml(question.question)}</div>
    `;

    if (question.image) {
        html += `<img src="${question.image}" alt="Question image" class="question-image">`;
    }

    if (question.type === 'multiple_choice') {
        html += renderMultipleChoice(question);
    } else if (question.type === 'multiple_complex') {
        html += renderMultipleComplex(question);
    } else if (question.type === 'matching') {
        html += renderMatching(question);
    }

    container.innerHTML = html;

    // Attach event listeners
    attachEventListeners(question);
}

function renderMultipleChoice(question) {
    return `
        <div class="options-container">
            ${question.options.map(opt => `
                <label class="option">
                    <input type="radio" name="option_${question.id}" value="${opt.id}" 
                        ${answers[question.id].includes(opt.id) ? 'checked' : ''}
                        onchange="selectOption('${question.id}', '${opt.id}', false)">
                    <span class="option-text">${escapeHtml(opt.text)}</span>
                </label>
            `).join('')}
        </div>
    `;
}

function renderMultipleComplex(question) {
    return `
        <div class="options-container">
            ${question.options.map(opt => `
                <label class="option">
                    <input type="checkbox" name="option_${question.id}" value="${opt.id}"
                        ${answers[question.id].includes(opt.id) ? 'checked' : ''}
                        onchange="selectOption('${question.id}', '${opt.id}', true)">
                    <span class="option-text">${escapeHtml(opt.text)}</span>
                </label>
            `).join('')}
        </div>
    `;
}

function renderMatching(question) {
    const pairs = question.pairs || [];
    const rightItems = [...pairs].sort(() => Math.random() - 0.5);

    return `
        <div class="matching-container">
            <div class="matching-column">
                <h4>Pilihan A</h4>
                ${pairs.map((pair, idx) => `
                    <div class="matching-item" draggable="true" 
                        ondragstart="dragStart(event, '${question.id}', '${pair.leftId}')"
                        ondragend="dragEnd(event)">
                        ${escapeHtml(pair.leftText)}
                    </div>
                `).join('')}
            </div>
            <div class="matching-column">
                <h4>Pilihan B</h4>
                ${rightItems.map(pair => `
                    <div class="matching-item matching-right" 
                        ondrop="drop(event, '${question.id}', '${pair.rightId}')"
                        ondragover="dragOver(event)"
                        data-pair-id="${pair.rightId}">
                        ${escapeHtml(pair.rightText)}
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

function selectOption(questionId, optionId, isMultiple) {
    if (!isMultiple) {
        answers[questionId] = [optionId];
    } else {
        const index = answers[questionId].indexOf(optionId);
        if (index > -1) {
            answers[questionId].splice(index, 1);
        } else {
            answers[questionId].push(optionId);
        }
    }
    updateQuestionSelector();
}

let draggedLeftId = null;

function dragStart(event, questionId, leftId) {
    draggedLeftId = { questionId, leftId };
    event.dataTransfer.effectAllowed = 'move';
    event.target.classList.add('dragging');
}

function dragEnd(event) {
    event.target.classList.remove('dragging');
}

function dragOver(event) {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
}

function drop(event, questionId, rightId) {
    event.preventDefault();
    if (draggedLeftId && draggedLeftId.questionId === questionId) {
        answers[questionId] = [rightId]; // Store as answer
        renderQuestion(); // Re-render to update matches
        updateQuestionSelector();
    }
}

function attachEventListeners(question) {
    // Event listeners already attached via onchange
}

function renderQuestionSelector() {
    const selector = document.getElementById('questionSelector');
    selector.innerHTML = quiz.questions.map((q, idx) => `
        <button class="question-btn ${idx === currentQuestionIndex ? 'active' : ''} ${
            answers[q.id].length > 0 ? 'answered' : ''
        }" onclick="jumpToQuestion(${idx})">
            ${idx + 1}
        </button>
    `).join('');
}

function updateQuestionSelector() {
    const buttons = document.querySelectorAll('.question-btn');
    buttons.forEach((btn, idx) => {
        btn.classList.toggle('answered', answers[quiz.questions[idx].id].length > 0);
    });
}

function jumpToQuestion(index) {
    currentQuestionIndex = index;
    document.getElementById('progressText').textContent = `${index + 1} / ${quiz.questions.length}`;
    renderQuestion();
    renderQuestionSelector();

    // Update navigation buttons
    document.getElementById('prevBtn').disabled = index === 0;
    document.getElementById('nextBtn').disabled = index === quiz.questions.length - 1;
}

function previousQuestion() {
    if (currentQuestionIndex > 0) {
        jumpToQuestion(currentQuestionIndex - 1);
    }
}

function nextQuestion() {
    if (currentQuestionIndex < quiz.questions.length - 1) {
        jumpToQuestion(currentQuestionIndex + 1);
    }
}

function startTimer() {
    startTime = Date.now();
    timerInterval = setInterval(() => {
        timeLeft--;
        updateTimerDisplay();

        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            submitQuiz();
        }
    }, 1000);
}

function updateTimerDisplay() {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    const display = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    document.getElementById('timerDisplay').textContent = display;

    // Highlight timer if less than 1 minute
    const timerDisplay = document.querySelector('.timer-display');
    if (timeLeft < 60) {
        timerDisplay.style.color = '#ef4444';
    }

    // Update progress bar
    const totalTime = quiz.duration;
    const percentage = ((totalTime - timeLeft) / totalTime) * 100;
    document.getElementById('progressBar').style.width = percentage + '%';
}

function openSubmitModal() {
    document.getElementById('submitModal').classList.remove('hidden');
}

function closeSubmitModal() {
    document.getElementById('submitModal').classList.add('hidden');
}

async function submitQuiz() {
    clearInterval(timerInterval);

    try {
        const timeSpent = quiz.duration - timeLeft;
        const endpoint = mode === 'match' 
            ? `/api/kuis/match/submit/${attemptId}`
            : `/api/kuis/attempt/submit/${attemptId}`;

        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                answers: Object.entries(answers).map(([qId, selectedAnswers]) => ({
                    questionId: qId,
                    selectedAnswers
                })),
                timeSpent
            })
        });

        const result = await response.json();

        if (!result.success) {
            alert('Gagal mengirim jawaban');
            return;
        }

        // Redirect to results page
        window.location.href = `/u/quiz-results?attemptId=${attemptId}`;

    } catch (error) {
        console.error('Error submitting quiz:', error);
        alert('Terjadi kesalahan saat mengirim jawaban');
    }
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