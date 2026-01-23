// Firebase Configuration (Replace with your own Firebase config)
const firebaseConfig = {
    // You'll add your Firebase config here
    // Instructions will be provided in README
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT.firebaseapp.com",
    databaseURL: "YOUR_DATABASE_URL",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_BUCKET",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// Check if Firebase is configured
const isFirebaseConfigured = firebaseConfig.apiKey !== "YOUR_API_KEY";

// Calendar State
let currentDate = new Date();
let events = [];
let editingEventId = null;
let db = null;
let eventsRef = null;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    if (isFirebaseConfigured && typeof firebase !== 'undefined') {
        initFirebase();
    } else {
        console.log('Running in offline mode - using localStorage');
        loadEvents();
    }
    renderCalendar();
    setupEventListeners();
    updateSyncStatus('Using local storage');
});

// Initialize Firebase
function initFirebase() {
    try {
        firebase.initializeApp(firebaseConfig);
        db = firebase.database();
        eventsRef = db.ref('events');

        // Listen for changes
        eventsRef.on('value', (snapshot) => {
            const data = snapshot.val();
            events = data ? Object.values(data) : [];
            renderCalendar();
            updateSyncStatus('Synced ✓');
        });

        updateSyncStatus('Connected to cloud');
    } catch (error) {
        console.error('Firebase initialization error:', error);
        loadEvents();
        updateSyncStatus('Using local storage');
    }
}

// Update sync status
function updateSyncStatus(message) {
    const statusEl = document.getElementById('syncStatus');
    if (statusEl) {
        statusEl.textContent = message;
        statusEl.style.opacity = '1';
        setTimeout(() => {
            statusEl.style.opacity = '0.7';
        }, 2000);
    }
}

// Load events from localStorage
function loadEvents() {
    const stored = localStorage.getItem('sharedCalendarEvents');
    if (stored) {
        events = JSON.parse(stored);
    }
}

// Save events to localStorage
function saveEvents() {
    localStorage.setItem('sharedCalendarEvents', JSON.stringify(events));
}

// Save event to Firebase or localStorage
function saveEvent(eventData, isDelete = false) {
    if (isFirebaseConfigured && eventsRef) {
        // Save to Firebase
        if (isDelete) {
            eventsRef.child(eventData.id).remove();
        } else {
            eventsRef.child(eventData.id).set(eventData);
        }
        updateSyncStatus('Syncing...');
    } else {
        // Fallback to localStorage
        if (isDelete) {
            events = events.filter(e => e.id !== eventData.id);
        } else {
            const index = events.findIndex(e => e.id === eventData.id);
            if (index !== -1) {
                events[index] = eventData;
            } else {
                events.push(eventData);
            }
        }
        saveEvents();
        renderCalendar();
    }
}

// Setup Event Listeners
function setupEventListeners() {
    document.getElementById('prevMonth').addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() - 1);
        renderCalendar();
    });

    document.getElementById('nextMonth').addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() + 1);
        renderCalendar();
    });

    document.getElementById('addEventBtn').addEventListener('click', () => {
        openEventModal();
    });

    document.getElementById('eventForm').addEventListener('submit', handleEventSubmit);

    document.getElementById('deleteEventBtn').addEventListener('click', deleteEvent);

    document.getElementById('cancelBtn').addEventListener('click', closeEventModal);

    document.querySelectorAll('.close').forEach(closeBtn => {
        closeBtn.addEventListener('click', () => {
            closeEventModal();
            closeDetailsModal();
        });
    });

    document.querySelectorAll('.details-close').forEach(closeBtn => {
        closeBtn.addEventListener('click', closeDetailsModal);
    });

    document.getElementById('exportBtn').addEventListener('click', exportToICS);

    document.getElementById('subscribeBtn').addEventListener('click', subscribeToCalendar);

    // Close modals when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            closeEventModal();
            closeDetailsModal();
        }
    });

    // Prevent iOS zoom on input focus
    document.querySelectorAll('input, textarea, select').forEach(element => {
        element.addEventListener('touchstart', (e) => {
            e.currentTarget.style.fontSize = '16px';
        });
    });
}

// Render Calendar
function renderCalendar() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    // Update header
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                       'July', 'August', 'September', 'October', 'November', 'December'];
    document.getElementById('currentMonth').textContent = `${monthNames[month]} ${year}`;

    // Get first day of month and number of days
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // Build calendar HTML
    let html = '<div class="calendar-header">';
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    dayNames.forEach(day => {
        html += `<div class="day-name">${day}</div>`;
    });
    html += '</div><div class="calendar-grid">';

    // Empty cells before first day
    for (let i = 0; i < firstDay; i++) {
        html += '<div class="calendar-day empty"></div>';
    }

    // Days of month
    for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const dayEvents = events.filter(e => e.date === dateStr);

        const isToday = new Date().toDateString() === new Date(year, month, day).toDateString();

        html += `<div class="calendar-day ${isToday ? 'today' : ''}" data-date="${dateStr}">
                    <div class="day-number">${day}</div>
                    <div class="day-events">`;

        dayEvents.forEach(event => {
            const timeStr = event.time ? `<span class="event-time">${formatTime(event.time)}</span> ` : '';
            html += `<div class="event-dot" style="background-color: ${event.color}"
                          data-event-id="${event.id}" title="${event.title}">
                        ${timeStr}<span class="event-title">${event.title}</span>
                    </div>`;
        });

        html += '</div></div>';
    }

    html += '</div>';
    document.getElementById('calendar').innerHTML = html;

    // Add click listeners to days and events
    document.querySelectorAll('.calendar-day:not(.empty)').forEach(day => {
        day.addEventListener('click', (e) => {
            if (e.target.closest('.event-dot')) {
                const eventId = e.target.closest('.event-dot').dataset.eventId;
                showEventDetails(eventId);
            } else {
                const date = day.dataset.date;
                openEventModal(date);
            }
        });
    });
}

// Format time for display
function formatTime(time24) {
    if (!time24) return '';
    const [hours, minutes] = time24.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes}${ampm}`;
}

// Open Event Modal
function openEventModal(date = null, event = null) {
    const modal = document.getElementById('eventModal');
    const form = document.getElementById('eventForm');

    form.reset();
    editingEventId = null;

    if (event) {
        // Editing existing event
        document.getElementById('modalTitle').textContent = 'Edit Event';
        document.getElementById('eventId').value = event.id;
        document.getElementById('eventTitle').value = event.title;
        document.getElementById('eventDate').value = event.date;
        document.getElementById('eventTime').value = event.time || '';
        document.getElementById('eventDescription').value = event.description || '';
        document.getElementById('eventColor').value = event.color;
        document.getElementById('deleteEventBtn').style.display = 'block';
        editingEventId = event.id;
    } else {
        // Adding new event
        document.getElementById('modalTitle').textContent = 'Add Event';
        document.getElementById('deleteEventBtn').style.display = 'none';
        if (date) {
            document.getElementById('eventDate').value = date;
        }
    }

    modal.style.display = 'block';

    // Focus on title input for better mobile experience
    setTimeout(() => {
        document.getElementById('eventTitle').focus();
    }, 300);
}

// Close Event Modal
function closeEventModal() {
    document.getElementById('eventModal').style.display = 'none';
    editingEventId = null;
}

// Handle Event Submit
function handleEventSubmit(e) {
    e.preventDefault();

    const eventData = {
        id: editingEventId || Date.now().toString() + Math.random().toString(36).substr(2, 9),
        title: document.getElementById('eventTitle').value,
        date: document.getElementById('eventDate').value,
        time: document.getElementById('eventTime').value,
        description: document.getElementById('eventDescription').value,
        color: document.getElementById('eventColor').value,
        lastModified: new Date().toISOString()
    };

    saveEvent(eventData);
    closeEventModal();
}

// Delete Event
function deleteEvent() {
    if (editingEventId && confirm('Are you sure you want to delete this event?')) {
        saveEvent({ id: editingEventId }, true);
        closeEventModal();
    }
}

// Show Event Details
function showEventDetails(eventId) {
    const event = events.find(e => e.id === eventId);
    if (!event) return;

    const detailsDiv = document.getElementById('eventDetails');
    const timeStr = event.time ? ` at ${formatTime(event.time)}` : '';

    detailsDiv.innerHTML = `
        <h2>${event.title}</h2>
        <p><strong>Date:</strong> ${formatDate(event.date)}${timeStr}</p>
        ${event.description ? `<p><strong>Description:</strong> ${event.description}</p>` : ''}
        <div class="color-indicator" style="background-color: ${event.color}"></div>
    `;

    document.getElementById('editEventBtn').onclick = () => {
        closeDetailsModal();
        openEventModal(null, event);
    };

    document.getElementById('eventDetailsModal').style.display = 'block';
}

// Close Details Modal
function closeDetailsModal() {
    document.getElementById('eventDetailsModal').style.display = 'none';
}

// Format Date
function formatDate(dateStr) {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

// Generate ICS content
function generateICSContent() {
    let icsContent = 'BEGIN:VCALENDAR\n';
    icsContent += 'VERSION:2.0\n';
    icsContent += 'PRODID:-//Our Shared Calendar//EN\n';
    icsContent += 'CALSCALE:GREGORIAN\n';
    icsContent += 'METHOD:PUBLISH\n';
    icsContent += 'X-WR-CALNAME:Our Shared Calendar\n';
    icsContent += 'X-WR-TIMEZONE:UTC\n';
    icsContent += 'X-WR-CALDESC:Shared calendar for couples\n';

    events.forEach(event => {
        const dateStr = event.date.replace(/-/g, '');
        const timeStr = event.time ? event.time.replace(/:/g, '') + '00' : '000000';
        const now = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

        icsContent += 'BEGIN:VEVENT\n';
        icsContent += `UID:${event.id}@sharedcalendar.local\n`;
        icsContent += `DTSTAMP:${now}\n`;
        icsContent += `DTSTART:${dateStr}T${timeStr}\n`;
        icsContent += `SUMMARY:${event.title}\n`;
        if (event.description) {
            icsContent += `DESCRIPTION:${event.description.replace(/\n/g, '\\n')}\n`;
        }
        icsContent += 'END:VEVENT\n';
    });

    icsContent += 'END:VCALENDAR';
    return icsContent;
}

// Export to ICS
function exportToICS() {
    const icsContent = generateICSContent();
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'our-shared-calendar.ics';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    updateSyncStatus('Calendar downloaded ✓');
}

// Subscribe to Calendar (for iOS)
function subscribeToCalendar() {
    const icsContent = generateICSContent();
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    // Create a link that iOS will recognize
    const a = document.createElement('a');
    a.href = url;
    a.download = 'our-shared-calendar.ics';

    // For iOS, we need to open the file directly
    if (navigator.userAgent.match(/iPhone|iPad|iPod/i)) {
        // Open in new window for iOS
        window.location.href = url;
    } else {
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }

    URL.revokeObjectURL(url);

    // Show instructions
    alert('After downloading:\n\n1. Open the .ics file\n2. Tap "Add All" to add events to your calendar\n3. Or tap "Subscribe" if prompted\n\nThe events will appear in your Apple Calendar app!');
}

// Register Service Worker for PWA
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('service-worker.js')
            .then(registration => {
                console.log('ServiceWorker registered');
            })
            .catch(err => {
                console.log('ServiceWorker registration failed: ', err);
            });
    });
}
