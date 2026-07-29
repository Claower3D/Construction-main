// ========== CALENDAR VOICE ADAPTER ==========
// Голосовой адаптер для инженерного календаря
// Регистрируется в CommandRouter как adapter 'calendar'
// Зависимости: commandRouter.js, calendarUI.js

(function () {
    'use strict';

    // ========== ADAPTER ==========

    const CalendarVoiceAdapter = {
        /**
         * Execute a calendar voice command
         * @param {object} cmd - Parsed command from CommandRouter
         * @returns {object} { success, message }
         */
        async execute(cmd) {
            switch (cmd.command) {
                case 'create':
                    return this._createEvent(cmd.entities);
                case 'move':
                    return this._moveEvent(cmd.entities);
                case 'delete':
                    return this._deleteEvent(cmd.entities);
                case 'addNote':
                    return this._addNote(cmd.entities);
                case 'showWeek':
                    return this._showView('week');
                case 'showDay':
                    return this._showView('day');
                case 'openObject':
                    return this._openObject(cmd.entities);
                default:
                    return { success: false, message: `Неизвестная команда календаря: ${cmd.command}` };
            }
        },

        // ── Create Event ──
        _createEvent(entities) {
            const calendar = this._getCalendar();
            if (!calendar) return { success: false, message: 'Календарь не активен' };

            const date = entities.date || new Date().toISOString().split('T')[0];
            const time = entities.time || '09:00';
            const title = entities.title || entities.text || 'Новое событие';

            // Try to use calendar's API
            if (calendar.addEvent) {
                const event = calendar.addEvent({
                    title,
                    date,
                    time,
                    duration: 60, // default 1 hour
                    type: 'inspection',
                    createdBy: 'voice'
                });
                return { success: true, message: `📅 Событие «${title}» создано на ${date} в ${time}` };
            }

            // Fallback: use localStorage directly
            const events = this._loadEvents();
            const newEvent = {
                id: 'evt_' + Date.now().toString(36),
                title,
                date,
                time,
                duration: 60,
                type: 'inspection',
                status: 'planned',
                createdAt: new Date().toISOString(),
                createdBy: 'voice'
            };
            events.push(newEvent);
            this._saveEvents(events);

            // Trigger UI refresh
            document.dispatchEvent(new CustomEvent('calendarEventCreated', { detail: newEvent }));

            return { success: true, message: `📅 Событие «${title}» создано на ${date} в ${time}` };
        },

        // ── Move Event ──
        _moveEvent(entities) {
            const date = entities.date;
            const time = entities.time;

            if (!date && !time) {
                return { success: false, message: 'Укажите дату или время для переноса' };
            }

            // Find selected/recent event
            const calendar = this._getCalendar();
            const selectedEvent = calendar?.getSelectedEvent?.() || this._getLastCreatedEvent();

            if (!selectedEvent) {
                return { success: false, message: 'Нет выбранного события для переноса' };
            }

            // Update event
            if (date) selectedEvent.date = date;
            if (time) selectedEvent.time = time;
            selectedEvent.updatedAt = new Date().toISOString();

            if (calendar?.updateEvent) {
                calendar.updateEvent(selectedEvent);
            } else {
                const events = this._loadEvents();
                const idx = events.findIndex(e => e.id === selectedEvent.id);
                if (idx >= 0) {
                    events[idx] = selectedEvent;
                    this._saveEvents(events);
                }
            }

            document.dispatchEvent(new CustomEvent('calendarEventMoved', { detail: selectedEvent }));

            const target = [date, time].filter(Boolean).join(' в ');
            return { success: true, message: `📅 Событие «${selectedEvent.title}» перенесено на ${target}` };
        },

        // ── Delete Event ──
        _deleteEvent(entities) {
            const calendar = this._getCalendar();
            const selectedEvent = calendar?.getSelectedEvent?.() || this._getLastCreatedEvent();

            if (!selectedEvent) {
                return { success: false, message: 'Нет выбранного события для удаления' };
            }

            if (calendar?.deleteEvent) {
                calendar.deleteEvent(selectedEvent.id);
            } else {
                const events = this._loadEvents();
                const filtered = events.filter(e => e.id !== selectedEvent.id);
                this._saveEvents(filtered);
            }

            document.dispatchEvent(new CustomEvent('calendarEventDeleted', { detail: selectedEvent }));

            return { success: true, message: `🗑️ Событие «${selectedEvent.title}» удалено` };
        },

        // ── Add Note ──
        _addNote(entities) {
            const text = entities.text || '';
            if (!text) {
                return { success: false, message: 'Нет текста для заметки' };
            }

            // Store note for today
            const today = new Date().toISOString().split('T')[0];
            const notes = JSON.parse(localStorage.getItem('calendar_notes') || '{}');
            if (!notes[today]) notes[today] = [];
            notes[today].push({
                id: 'note_' + Date.now().toString(36),
                text,
                createdAt: new Date().toISOString(),
                createdBy: 'voice'
            });
            localStorage.setItem('calendar_notes', JSON.stringify(notes));

            document.dispatchEvent(new CustomEvent('calendarNoteAdded', { detail: { date: today, text } }));

            return { success: true, message: `📝 Заметка добавлена: «${text}»` };
        },

        // ── Show View ──
        _showView(viewType) {
            const calendar = this._getCalendar();
            if (calendar?.setView) {
                calendar.setView(viewType);
                return { success: true, message: `📅 Показан вид: ${viewType === 'week' ? 'Неделя' : 'День'}` };
            }

            // Fallback: try to click view buttons
            const btn = document.querySelector(
                viewType === 'week'
                    ? '[data-testid="calendar-view-week"], .calendar-view-week'
                    : '[data-testid="calendar-view-day"], .calendar-view-day'
            );
            if (btn) {
                btn.click();
                return { success: true, message: `📅 Показан вид: ${viewType === 'week' ? 'Неделя' : 'День'}` };
            }

            return { success: false, message: 'Не удалось переключить вид календаря' };
        },

        // ── Open Object ──
        _openObject(entities) {
            const num = entities.objectNumber;
            if (!num) {
                return { success: false, message: 'Укажите номер объекта' };
            }

            // Try to navigate to object
            const calendar = this._getCalendar();
            if (calendar?.openObject) {
                calendar.openObject(parseInt(num));
                return { success: true, message: `🏗️ Открыт объект #${num}` };
            }

            return { success: false, message: `Объект #${num} не найден` };
        },

        // ── Helpers ──

        _getCalendar() {
            return window.CalendarUI || window.EngineerCalendar || null;
        },

        _loadEvents() {
            try {
                return JSON.parse(localStorage.getItem('calendar_events') || '[]');
            } catch {
                return [];
            }
        },

        _saveEvents(events) {
            localStorage.setItem('calendar_events', JSON.stringify(events));
        },

        _getLastCreatedEvent() {
            const events = this._loadEvents();
            if (events.length === 0) return null;
            return events.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
        }
    };

    // ========== REGISTER ADAPTER ==========

    if (window.CommandRouter) {
        window.CommandRouter.registerAdapter('calendar', CalendarVoiceAdapter);
    } else {
        // Wait for CommandRouter to load
        document.addEventListener('DOMContentLoaded', () => {
            if (window.CommandRouter) {
                window.CommandRouter.registerAdapter('calendar', CalendarVoiceAdapter);
            }
        });
    }

    // Export for testing
    window.CalendarVoiceAdapter = CalendarVoiceAdapter;

    console.log('✅ CalendarVoiceAdapter loaded');
})();
