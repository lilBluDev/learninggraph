// Jadwal page functions
function showAddScheduleModal() {
    alert('Fitur tambah jadwal akan segera hadir!');
}

document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('scheduleContainer');
    
    const schedules = [
        { time: '08:00 - 10:00', activity: 'Belajar Matematika', subject: 'Matematika' },
        { time: '10:30 - 11:30', activity: 'Istirahat', subject: 'Break' },
        { time: '13:00 - 14:30', activity: 'Belajar Fisika', subject: 'Fisika' }
    ];

    if (schedules.length === 0) {
        container.innerHTML = '<p class="empty-state">Belum ada jadwal</p>';
        return;
    }

    container.innerHTML = schedules.map(s => `
        <div class="schedule-item">
            <div class="schedule-time"><i class="fas fa-clock"></i> ${s.time}</div>
            <div class="schedule-desc">${s.activity}</div>
        </div>
    `).join('');
});
