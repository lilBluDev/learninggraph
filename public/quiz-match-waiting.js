let matchId = null;
let pollInterval = null;
let waitingStartTime = null;
let waitingTimerInterval = null;

const params = new URLSearchParams(window.location.search);
matchId = params.get('matchId');

document.addEventListener('DOMContentLoaded', async () => {
    if (!matchId) {
        window.location.href = '/u/games';
        return;
    }

    waitingStartTime = Date.now();
    startWaitingTimer();
    await loadMatchInfo();
    startPolling();
});

async function loadMatchInfo() {
    try {
        const response = await fetch(`/api/kuis/match/${matchId}`, {
            method: 'GET'
        });

        if (!response.ok) {
            throw new Error('Failed to load match info');
        }

        const result = await response.json();
        const match = result.data;

        // Get quiz info
        const quizResponse = await fetch(`/api/kuis/${match.kuis}`, {
            method: 'GET'
        });

        if (quizResponse.ok) {
            const quizResult = await quizResponse.json();
            const quiz = quizResult.data;

            document.getElementById('quizTitle').textContent = quiz.title;
            document.getElementById('quizSubject').textContent = quiz.subject;
            document.getElementById('duration').textContent = `${Math.floor(quiz.duration / 60)} menit`;
        }

        document.getElementById('matchCode').textContent = matchId.slice(-8).toUpperCase();

        // Check if match already has 2 players
        if (match.status === 'in_progress') {
            showStartingState(match);
        }

    } catch (error) {
        console.error('Error loading match info:', error);
        alert('Gagal memuat informasi match');
        window.location.href = '/u/games';
    }
}

function startPolling() {
    // Poll every 2 seconds
    pollInterval = setInterval(async () => {
        try {
            const response = await fetch(`/api/kuis/match/${matchId}`, {
                method: 'GET'
            });

            if (!response.ok) {
                clearInterval(pollInterval);
                return;
            }

            const result = await response.json();
            const match = result.data;

            if (match.status === 'in_progress') {
                clearInterval(pollInterval);
                clearInterval(waitingTimerInterval);
                showStartingState(match);
            }

        } catch (error) {
            console.error('Polling error:', error);
        }
    }, 2000);
}

function startWaitingTimer() {
    waitingTimerInterval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - waitingStartTime) / 1000);
        const minutes = Math.floor(elapsed / 60);
        const seconds = elapsed % 60;
        document.getElementById('waitingTime').textContent = 
            `${minutes}:${String(seconds).padStart(2, '0')}`;
    }, 1000);
}

async function showStartingState(match) {
    // Hide waiting state
    document.getElementById('waitingState').style.display = 'none';
    document.getElementById('startingState').classList.remove('hidden');

    // Get user info
    const player1 = match.player1.userId;
    const player2 = match.player2.userId;

    // Set player 1 info
    document.getElementById('player1Name').textContent = player1.displayName;
    document.getElementById('player1Level').textContent = player1.level || 1;
    if (player1.avatar) {
        document.getElementById('player1Avatar').src = player1.avatar;
    }

    // Set player 2 info
    document.getElementById('player2Name').textContent = player2.displayName;
    document.getElementById('player2Level').textContent = player2.level || 1;
    if (player2.avatar) {
        document.getElementById('player2Avatar').src = player2.avatar;
    }

    // Start countdown
    let countdown = 3;
    const countdownElement = document.getElementById('countdown');
    
    const countdownInterval = setInterval(() => {
        countdown--;
        countdownElement.textContent = countdown;
        
        if (countdown <= 0) {
            clearInterval(countdownInterval);
            startMatch(match);
        }
    }, 1000);
}

async function startMatch(match) {
    try {
        // Get current user's attempt
        const response = await fetch(`/api/kuis/match/${matchId}`, {
            method: 'GET'
        });

        if (!response.ok) {
            throw new Error('Failed to get match info');
        }

        const result = await response.json();
        const matchData = result.data;

        // Determine which attempt belongs to current user
        const userResponse = await fetch('/api/user', {
            method: 'GET'
        });

        if (!userResponse.ok) {
            throw new Error('Failed to get user info');
        }

        const userResult = await userResponse.json();
        const currentUserId = userResult.data._id;

        let attemptId;
        if (matchData.player1.userId._id === currentUserId) {
            attemptId = matchData.player1.attemptId;
        } else if (matchData.player2.userId._id === currentUserId) {
            attemptId = matchData.player2.attemptId;
        }

        if (!attemptId) {
            throw new Error('Attempt not found');
        }

        // Redirect to quiz player
        window.location.href = `/u/quiz?attemptId=${attemptId}&mode=match&matchId=${matchId}`;

    } catch (error) {
        console.error('Error starting match:', error);
        alert('Gagal memulai pertandingan');
        window.location.href = '/u/games';
    }
}

function copyMatchLink() {
    const matchLink = `${window.location.origin}/u/games?matchId=${matchId}`;
    
    const textarea = document.createElement('textarea');
    textarea.value = matchLink;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    
    try {
        document.execCommand('copy');
        
        // Visual feedback
        const btn = document.querySelector('.btn-copy');
        const originalText = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-check"></i> Tersalin!';
        btn.style.background = '#22c55e';
        
        setTimeout(() => {
            btn.innerHTML = originalText;
            btn.style.background = '';
        }, 2000);
        
    } catch (err) {
        alert('Gagal menyalin link');
    }
    
    document.body.removeChild(textarea);
}

function shareMatch() {
    const matchLink = `${window.location.origin}/u/games?matchId=${matchId}`;
    const text = `Ayo main quiz bareng! Join match saya: ${matchLink}`;
    
    if (navigator.share) {
        navigator.share({
            title: 'Join Quiz Match',
            text: text,
            url: matchLink
        }).catch((err) => {
            if (err.name !== 'AbortError') {
                copyMatchLink();
            }
        });
    } else {
        copyMatchLink();
    }
}

function goBack() {
    if (confirm('Yakin ingin keluar? Match akan dibatalkan.')) {
        // Optionally call API to cancel match
        clearInterval(pollInterval);
        clearInterval(waitingTimerInterval);
        window.location.href = '/u/games';
    }
}

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (pollInterval) clearInterval(pollInterval);
    if (waitingTimerInterval) clearInterval(waitingTimerInterval);
});