// Firebase Configuration (Replace with your own Firebase config)
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT.firebaseapp.com",
    databaseURL: "YOUR_DATABASE_URL",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_BUCKET",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
};

const isFirebaseConfigured = firebaseConfig.apiKey !== "YOUR_API_KEY";

// ── Categories ───────────────────────────────────────────────────────────────
const CATEGORIES = {
    'Date Night':         { color: '#9966CC', emoji: '💜' },
    'Joint Social Event': { color: '#4472C4', emoji: '💙' },
    'Travel':             { color: '#70AD47', emoji: '💚' },
    'Darcey Event':       { color: '#ED7D31', emoji: '🧡' },
    'Rupert Event':       { color: '#C55A11', emoji: '❤️' },
    'Sydney Staying':     { color: '#FFC000', emoji: '💛' },
};

function categoryColor(cat) {
    return (CATEGORIES[cat] && CATEGORIES[cat].color) || '#4472C4';
}

// ── State ────────────────────────────────────────────────────────────────────
let currentDate = new Date();
let events = [];
let editingEventId = null;
let db = null;
let eventsRef = null;

// ── Init ─────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    if (isFirebaseConfigured && typeof firebase !== 'undefined') {
        initFirebase();
    } else {
        loadEvents();
        renderCalendar();
    }
    setupEventListeners();
    updateSyncStatus('Using local storage');
});

// ── Firebase ──────────────────────────────────────────────────────────────────
function initFirebase() {
    try {
        firebase.initializeApp(firebaseConfig);
        db = firebase.database();
        eventsRef = db.ref('events');
        eventsRef.on('value', (snapshot) => {
            const data = snapshot.val();
            events = data ? Object.values(data).map(migrateEvent) : [];
            renderCalendar();
            updateSyncStatus('Synced ✓');
        });
        updateSyncStatus('Connected to cloud');
    } catch (error) {
        loadEvents();
        renderCalendar();
        updateSyncStatus('Using local storage');
    }
}

function updateSyncStatus(message) {
    const el = document.getElementById('syncStatus');
    if (el) {
        el.textContent = message;
        el.style.opacity = '1';
        setTimeout(() => { el.style.opacity = '0.7'; }, 2000);
    }
}

// ── Storage ───────────────────────────────────────────────────────────────────
function loadEvents() {
    const stored = localStorage.getItem('sharedCalendarEvents');
    if (stored) events = JSON.parse(stored).map(migrateEvent);
}

function saveEvents() {
    localStorage.setItem('sharedCalendarEvents', JSON.stringify(events));
}

// Migrate old date/time fields to startDate/startTime
function migrateEvent(e) {
    if (e.date && !e.startDate) {
        e.startDate = e.date;
        e.startTime = e.time || '';
        delete e.date;
        delete e.time;
    }
    if (!e.category) e.category = 'Joint Social Event';
    e.color = categoryColor(e.category);
    return e;
}

// ── Save/Delete ───────────────────────────────────────────────────────────────
function saveEvent(eventData, isDelete = false) {
    if (isFirebaseConfigured && eventsRef) {
        if (isDelete) {
            eventsRef.child(eventData.id).remove();
        } else {
            eventsRef.child(eventData.id).set(eventData);
        }
        updateSyncStatus('Syncing...');
    } else {
        if (isDelete) {
            events = events.filter(e => e.id !== eventData.id);
        } else {
            const i = events.findIndex(e => e.id === eventData.id);
            if (i !== -1) events[i] = eventData; else events.push(eventData);
        }
        saveEvents();
        renderCalendar();
    }
}

// ── Listeners ─────────────────────────────────────────────────────────────────
function setupEventListeners() {
    document.getElementById('prevMonth').addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() - 1); renderCalendar();
    });
    document.getElementById('nextMonth').addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() + 1); renderCalendar();
    });
    document.getElementById('addEventBtn').addEventListener('click', () => openEventModal());
    document.getElementById('eventForm').addEventListener('submit', handleEventSubmit);
    document.getElementById('deleteEventBtn').addEventListener('click', deleteEvent);
    document.getElementById('cancelBtn').addEventListener('click', closeEventModal);
    document.querySelectorAll('.close').forEach(btn => {
        btn.addEventListener('click', () => { closeEventModal(); closeDetailsModal(); });
    });
    document.querySelectorAll('.details-close').forEach(btn => {
        btn.addEventListener('click', closeDetailsModal);
    });
    document.getElementById('exportBtn').addEventListener('click', exportToICS);
    document.getElementById('subscribeBtn').addEventListener('click', subscribeToCalendar);
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) { closeEventModal(); closeDetailsModal(); }
    });
    // Auto-fill end date when start date is picked
    document.getElementById('eventStartDate').addEventListener('change', (e) => {
        const end = document.getElementById('eventEndDate');
        if (!end.value) end.value = e.target.value;
    });
}

// ── Render ────────────────────────────────────────────────────────────────────
function renderCalendar() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const monthNames = ['January','February','March','April','May','June',
                        'July','August','September','October','November','December'];
    document.getElementById('currentMonth').textContent = `${monthNames[month]} ${year}`;

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    let html = '<div class="calendar-header">';
    ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].forEach(d => { html += `<div class="day-name">${d}</div>`; });
    html += '</div><div class="calendar-grid">';

    for (let i = 0; i < firstDay; i++) html += '<div class="calendar-day empty"></div>';

    for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
        const isToday = new Date().toDateString() === new Date(year, month, day).toDateString();
        const dayEvents = events.filter(e => {
            const start = e.startDate || e.date;
            const end = e.endDate || start;
            return dateStr >= start && dateStr <= end;
        });

        html += `<div class="calendar-day ${isToday ? 'today' : ''}" data-date="${dateStr}">
                    <div class="day-number">${day}</div>
                    <div class="day-events">`;
        dayEvents.forEach(event => {
            const t = event.startTime ? `<span class="event-time">${formatTime(event.startTime)}</span> ` : '';
            html += `<div class="event-dot" style="background-color:${event.color}" data-event-id="${event.id}">
                        ${t}<span class="event-title">${event.title}</span>
                     </div>`;
        });
        html += '</div></div>';
    }
    html += '</div>';
    document.getElementById('calendar').innerHTML = html;

    document.querySelectorAll('.calendar-day:not(.empty)').forEach(day => {
        day.addEventListener('click', (e) => {
            const dot = e.target.closest('.event-dot');
            if (dot) showEventDetails(dot.dataset.eventId);
            else openEventModal(day.dataset.date);
        });
    });
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatTime(t) {
    if (!t) return '';
    const [h, m] = t.split(':');
    const hr = parseInt(h);
    return `${hr % 12 || 12}:${m}${hr >= 12 ? 'PM' : 'AM'}`;
}

function formatDate(dateStr) {
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
        weekday: 'short', year: 'numeric', month: 'short', day: 'numeric'
    });
}

function formatDateTimeRange(event) {
    const start = formatDate(event.startDate);
    const startTime = event.startTime ? ` ${formatTime(event.startTime)}` : '';
    const multiDay = event.endDate && event.endDate !== event.startDate;
    const endDate = multiDay ? ` → ${formatDate(event.endDate)}` : '';
    const endTime = event.endTime ? `${multiDay ? '' : ' →'} ${formatTime(event.endTime)}` : '';
    return `${start}${startTime}${endDate}${endTime}`;
}

// ── Modal ─────────────────────────────────────────────────────────────────────
function openEventModal(date = null, event = null) {
    document.getElementById('eventForm').reset();
    editingEventId = null;

    if (event) {
        document.getElementById('modalTitle').textContent = 'Edit Event';
        document.getElementById('eventId').value = event.id;
        document.getElementById('eventTitle').value = event.title;
        document.getElementById('eventCategory').value = event.category || 'Joint Social Event';
        document.getElementById('eventStartDate').value = event.startDate || '';
        document.getElementById('eventStartTime').value = event.startTime || '';
        document.getElementById('eventEndDate').value = event.endDate || '';
        document.getElementById('eventEndTime').value = event.endTime || '';
        document.getElementById('eventLocation').value = event.location || '';
        document.getElementById('eventDescription').value = event.description || '';
        document.getElementById('deleteEventBtn').style.display = 'block';
        editingEventId = event.id;
    } else {
        document.getElementById('modalTitle').textContent = 'Add Event';
        document.getElementById('deleteEventBtn').style.display = 'none';
        if (date) {
            document.getElementById('eventStartDate').value = date;
            document.getElementById('eventEndDate').value = date;
        }
    }
    document.getElementById('eventModal').style.display = 'block';
    setTimeout(() => document.getElementById('eventTitle').focus(), 300);
}

function closeEventModal() {
    document.getElementById('eventModal').style.display = 'none';
    editingEventId = null;
}

function handleEventSubmit(e) {
    e.preventDefault();
    const category = document.getElementById('eventCategory').value;
    const startDate = document.getElementById('eventStartDate').value;
    const endDate = document.getElementById('eventEndDate').value || startDate;
    saveEvent({
        id:           editingEventId || Date.now().toString() + Math.random().toString(36).substr(2, 9),
        title:        document.getElementById('eventTitle').value,
        category,
        color:        categoryColor(category),
        startDate,
        startTime:    document.getElementById('eventStartTime').value,
        endDate,
        endTime:      document.getElementById('eventEndTime').value,
        location:     document.getElementById('eventLocation').value,
        description:  document.getElementById('eventDescription').value,
        lastModified: new Date().toISOString()
    });
    closeEventModal();
}

function deleteEvent() {
    if (editingEventId && confirm('Are you sure you want to delete this event?')) {
        saveEvent({ id: editingEventId }, true);
        closeEventModal();
    }
}

// ── Details ───────────────────────────────────────────────────────────────────
function showEventDetails(eventId) {
    const event = events.find(e => e.id === eventId);
    if (!event) return;
    const cat = CATEGORIES[event.category] || {};
    let html = `<h2>${event.title}</h2>`;
    html += `<p class="event-category-badge" style="background:${event.color}">${cat.emoji || '📅'} ${event.category}</p>`;
    html += `<p><strong>When:</strong> ${formatDateTimeRange(event)}</p>`;
    if (event.location)    html += `<p><strong>📍 Location:</strong> ${event.location}</p>`;
    if (event.description) html += `<p><strong>Notes:</strong> ${event.description}</p>`;
    document.getElementById('eventDetails').innerHTML = html;
    document.getElementById('editEventBtn').onclick = () => { closeDetailsModal(); openEventModal(null, event); };
    document.getElementById('eventDetailsModal').style.display = 'block';
}

function closeDetailsModal() {
    document.getElementById('eventDetailsModal').style.display = 'none';
}

// ── ICS Export ────────────────────────────────────────────────────────────────
function generateICSContent() {
    let ics = 'BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//Our Shared Calendar//EN\nCALSCALE:GREGORIAN\nMETHOD:PUBLISH\nX-WR-CALNAME:Our Shared Calendar\n';
    const now = new Date().toISOString().replace(/[-:]/g,'').split('.')[0]+'Z';
    events.forEach(event => {
        const sd = (event.startDate||'').replace(/-/g,'');
        const ed = (event.endDate||event.startDate||'').replace(/-/g,'');
        const st = event.startTime ? event.startTime.replace(/:/g,'')+'00' : '000000';
        const et = event.endTime   ? event.endTime.replace(/:/g,'')+'00'   : st;
        ics += `BEGIN:VEVENT\nUID:${event.id}@sharedcalendar.local\nDTSTAMP:${now}\nDTSTART:${sd}T${st}\nDTEND:${ed}T${et}\nSUMMARY:${event.title}\n`;
        if (event.location)    ics += `LOCATION:${event.location}\n`;
        if (event.description) ics += `DESCRIPTION:${event.description.replace(/\n/g,'\\n')}\n`;
        ics += 'END:VEVENT\n';
    });
    return ics + 'END:VCALENDAR';
}

function exportToICS() {
    const blob = new Blob([generateICSContent()], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'our-shared-calendar.ics';
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
    updateSyncStatus('Calendar downloaded ✓');
}

function subscribeToCalendar() {
    const blob = new Blob([generateICSContent()], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    if (navigator.userAgent.match(/iPhone|iPad|iPod/i)) {
        window.location.href = url;
    } else {
        const a = document.createElement('a');
        a.href = url; a.download = 'our-shared-calendar.ics';
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
    }
    URL.revokeObjectURL(url);
    alert('After downloading:\n\n1. Open the .ics file\n2. Tap "Add All"\n\nEvents will appear in Apple Calendar!');
}
