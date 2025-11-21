// State Management
let currentDate = new Date();
let selectedDate = null;
let events = [];
let todos = [];

// API Functions
const API = {
    // Events
    async getEvents() {
        try {
            const response = await fetch(`/api/jadwal/events`);
            if (!response.ok) throw new Error('Failed to fetch events');
            return await response.json();
        } catch (error) {
            console.error('Error fetching events:', error);
            return [];
        }
    },

    async createEvent(eventData) {
        try {
            const response = await fetch(`/api/jadwal/events`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(eventData)
            });
            console.log(response);
            if (!response.ok) throw new Error('Failed to create event');
            return await response.json();
        } catch (error) {
            console.error('Error creating event:', error);
            throw error;
        }
    },

    async deleteEvent(eventId) {
        try {
            const response = await fetch(`/api/jadwal/events/${eventId}`, {
                method: 'DELETE'
            });
            if (!response.ok) throw new Error('Failed to delete event');
            return await response.json();
        } catch (error) {
            console.error('Error deleting event:', error);
            throw error;
        }
    },

    // Todos
    async getTodos() {
        try {
            const response = await fetch(`/api/jadwal/todos`);
            if (!response.ok) throw new Error('Failed to fetch todos');
            return await response.json();
        } catch (error) {
            console.error('Error fetching todos:', error);
            return [];
        }
    },

    async createTodo(todoData) {
        try {
            const response = await fetch(`/api/jadwal/todos`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(todoData)
            });
            if (!response.ok) throw new Error('Failed to create todo');
            return await response.json();
        } catch (error) {
            console.error('Error creating todo:', error);
            throw error;
        }
    },

    async updateTodo(todoId, todoData) {
        try {
            const response = await fetch(`/api/jadwal/todos/${todoId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(todoData)
            });
            if (!response.ok) throw new Error('Failed to update todo');
            return await response.json();
        } catch (error) {
            console.error('Error updating todo:', error);
            throw error;
        }
    },

    async deleteTodo(todoId) {
        try {
            const response = await fetch(`/api/jadwal/todos/${todoId}`, {
                method: 'DELETE'
            });
            if (!response.ok) throw new Error('Failed to delete todo');
            return await response.json();
        } catch (error) {
            console.error('Error deleting todo:', error);
            throw error;
        }
    }
};

// Calendar Functions
function renderCalendar() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const monthNames = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
    
    document.getElementById('currentMonth').textContent = `${monthNames[month]} ${year}`;
    
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const prevMonthDays = new Date(year, month, 0).getDate();
    
    let html = '';
    const dayNames = ['Min','Sen','Sel','Rab','Kam','Jum','Sab'];
    dayNames.forEach(day => {
        html += `<div class="calendar-day">${day}</div>`;
    });
    
    // Previous month days
    for (let i = firstDay - 1; i >= 0; i--) {
        html += `<div class="calendar-date other-month">${prevMonthDays - i}</div>`;
    }
    
    // Current month days
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    
    for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const isToday = dateStr === todayStr;
        const isSelected = selectedDate === dateStr;
        const hasEvent = events.some(e => e.date === dateStr);
        
        let classes = 'calendar-date';
        if (isToday) classes += ' today';
        if (isSelected) classes += ' selected';
        if (hasEvent) classes += ' has-event';
        
        html += `<div class="${classes}" onclick="selectDate('${dateStr}')">${day}</div>`;
    }
    
    // Next month days
    const totalCells = firstDay + daysInMonth;
    const remainingCells = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);
    for (let i = 1; i <= remainingCells; i++) {
        html += `<div class="calendar-date other-month">${i}</div>`;
    }
    
    document.getElementById('calendarGrid').innerHTML = html;
}

function changeMonth(delta) {
    if (delta === 0) {
        currentDate = new Date();
    } else {
        currentDate.setMonth(currentDate.getMonth() + delta);
    }
    renderCalendar();
}

function selectDate(dateStr) {
    selectedDate = dateStr;
    document.getElementById('eventDate').value = dateStr;
    renderCalendar();
}

// Event Management
async function loadEvents() {
    events = await API.getEvents();
    events.sort((a, b) => new Date(a.date + ' ' + a.time) - new Date(b.date + ' ' + b.time));
    renderEvents();
    renderCalendar();
}

function renderEvents() {
    const list = document.getElementById('eventList');
    if (events.length === 0) {
        list.innerHTML = '<div class="empty-state"><i class="far fa-calendar"></i><p>Belum ada event</p></div>';
        return;
    }
    
    const today = new Date().toISOString().slice(0, 10);
    list.innerHTML = events.map(event => {
        const isUrgent = event.priority === 'urgent';
        const isToday = event.date === today;
        console.log(event)
        return `
            <div class="event-item ${isUrgent ? 'urgent' : ''}">
                <div class="event-date">
                    <i class="far fa-calendar"></i> ${formatDate(event.date)}
                    ${isToday ? '<span class="badge badge-today">Hari Ini</span>' : ''}
                    ${isUrgent ? '<span class="badge badge-urgent">Urgent</span>' : ''}
                </div>
                <div class="event-title">${event.title}</div>
                <div class="event-time"><i class="far fa-clock"></i> ${event.time}</div>
                ${event.desc ? `<div class="event-desc">${event.desc}</div>` : ''}
                <div class="event-actions">
                    <button class="btn-small btn-delete" onclick="deleteEvent('${event._id}')">
                        <i class="fas fa-trash"></i> Hapus
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

async function deleteEvent(eventId) {
    if (confirm('Hapus event ini?')) {
        try {
            await API.deleteEvent(eventId);
            await loadEvents();
        } catch (error) {
            alert('Gagal menghapus event');
        }
    }
}

function formatDate(dateStr) {
    const date = new Date(dateStr + 'T00:00:00');
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    return `${days[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
}

// Todo Management
async function loadTodos() {
    todos = await API.getTodos();
    renderTodos();
}

function renderTodos() {
    const list = document.getElementById('todoList');
    if (todos.length === 0) {
        list.innerHTML = '<div class="empty-state"><i class="far fa-clipboard"></i><p>Belum ada todo</p></div>';
        return;
    }
    
    list.innerHTML = todos.map(todo => `
        <div class="todo-item ${todo.completed ? 'completed' : ''}">
            <input type="checkbox" class="todo-checkbox" ${todo.completed ? 'checked' : ''} 
                   onchange="toggleTodo('${todo.id}', ${!todo.completed})">
            <span class="todo-text">${todo.text}</span>
            <button class="btn-small btn-delete" onclick="deleteTodo('${todo.id}')">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `).join('');
}

async function toggleTodo(todoId, completed) {
    try {
        await API.updateTodo(todoId, { completed });
        await loadTodos();
    } catch (error) {
        alert('Gagal update todo');
    }
}

async function deleteTodo(todoId) {
    try {
        await API.deleteTodo(todoId);
        await loadTodos();
    } catch (error) {
        alert('Gagal menghapus todo');
    }
}

// Event Handlers
document.addEventListener('DOMContentLoaded', () => {
    // Load data
    loadEvents();
    loadTodos();
    renderCalendar();
    
    // Set default date
    document.getElementById('eventDate').valueAsDate = new Date();
    
    // Event form
    document.getElementById('eventForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const eventData = {
            title: document.getElementById('eventTitle').value,
            date: document.getElementById('eventDate').value,
            time: document.getElementById('eventTime').value,
            desc: document.getElementById('eventDesc').value,
            priority: document.getElementById('eventPriority').value
        };
        
        try {
            await API.createEvent(eventData);
            e.target.reset();
            document.getElementById('eventDate').valueAsDate = new Date();
            await loadEvents();
        } catch (error) {
            alert('Gagal menambahkan event');
        }
    });
    
    // Todo form
    document.getElementById('todoForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const todoData = {
            text: document.getElementById('todoInput').value,
            completed: false
        };
        
        try {
            await API.createTodo(todoData);
            e.target.reset();
            await loadTodos();
        } catch (error) {
            alert('Gagal menambahkan todo');
        }
    });
});