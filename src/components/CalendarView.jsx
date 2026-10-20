import { useState } from 'react';
import { todayKey, toDateKey } from '../lib/dates.js';

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function CalendarView({ events, onAddOnDate, onEventClick }) {
  const [month, setMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const year = month.getFullYear();
  const monthIndex = month.getMonth();
  const firstDay = new Date(year, monthIndex, 1).getDay();
  const numberOfDays = new Date(year, monthIndex + 1, 0).getDate();
  const totalCells = Math.ceil((firstDay + numberOfDays) / 7) * 7;
  const today = todayKey();

  const byDate = new Map();
  events.forEach((event) => {
    if (!byDate.has(event.date)) byDate.set(event.date, []);
    byDate.get(event.date).push(event);
  });
  byDate.forEach((items) => items.sort((a, b) => a.time.localeCompare(b.time)));

  function shiftMonth(amount) {
    setMonth(new Date(year, monthIndex + amount, 1));
  }

  return (
    <section className="calendar-panel" aria-label="Monthly calendar">
      <header className="calendar-heading">
        <h2>{month.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</h2>
        <div className="calendar-controls">
          <button type="button" className="secondary small-button" onClick={() => {
            const now = new Date();
            setMonth(new Date(now.getFullYear(), now.getMonth(), 1));
          }}>Today</button>
          <button type="button" className="secondary icon-button" aria-label="Previous month"
            onClick={() => shiftMonth(-1)}>‹</button>
          <button type="button" className="secondary icon-button" aria-label="Next month"
            onClick={() => shiftMonth(1)}>›</button>
        </div>
      </header>
      <div className="calendar-grid">
        {DAY_LABELS.map((day) => <div key={day} className="weekday">{day}</div>)}
        {Array.from({ length: totalCells }, (_, i) => {
          const day = i - firstDay + 1;
          if (day < 1 || day > numberOfDays) {
            return <div key={`empty-${i}`} className="calendar-day empty" />;
          }
          const date = toDateKey(year, monthIndex, day);
          const dayEvents = byDate.get(date) || [];
          return (
            <div key={date} className={`calendar-day ${today === date ? 'today-cell' : ''}`}>
              <button type="button" className="day-number"
                aria-label={`Add event on ${date}`} title="Add event"
                onClick={() => onAddOnDate(date)}>{day}</button>
              {dayEvents.slice(0, 2).map((event) => (
                <button type="button" key={event.id}
                  className={`calendar-event type-${event.type.toLowerCase().replaceAll(' ', '-')}`}
                  title={event.title} onClick={() => onEventClick(event)}>
                  {event.title}
                </button>
              ))}
              {dayEvents.length > 2 && (
                <span className="more-events">+{dayEvents.length - 2} more</span>
              )}
            </div>
          );
        })}
      </div>
      <p className="calendar-hint">Select a day number to add an event. Select an event to view its details.</p>
    </section>
  );
}
