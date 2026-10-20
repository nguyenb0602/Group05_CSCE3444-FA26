import { useEffect, useRef, useState } from 'react';
import CalendarView from './CalendarView.jsx';
import CourseForm from './CourseForm.jsx';
import EventForm from './EventForm.jsx';
import { formatDate, formatTime, todayKey } from '../lib/dates.js';
import { loadPlannerData, savePlannerData } from '../lib/storage.js';

function Dialog({ title, onClose, children }) {
  const dialogRef = useRef(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
    return () => {
      if (dialog?.open) dialog.close();
    };
  }, []);

  return (
    <dialog ref={dialogRef} className="app-dialog" aria-label={title}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}>
      <div className="dialog-heading">
        <h2>{title}</h2>
        <button type="button" className="icon-button secondary" aria-label="Close dialog"
          onClick={onClose}>×</button>
      </div>
      {children}
    </dialog>
  );
}

export default function Dashboard({ user, onLogout }) {
  const [data, setData] = useState(() => loadPlannerData(user.email));
  const [page, setPage] = useState('Dashboard');
  const [dialog, setDialog] = useState(null);

  const { courses, events } = data;

  useEffect(() => {
    savePlannerData(user.email, data);
  }, [user.email, data]);

  function saveCourse(course) {
    setData((previous) => ({
      ...previous,
      courses: [...previous.courses, course],
    }));
    setDialog(null);
  }

  function saveEvent(event) {
    setData((previous) => ({
      ...previous,
      events: [...previous.events, event],
    }));
    setDialog(null);
  }

  function deleteCourse(id) {
    const linkedEvents = events.filter((event) => event.courseId === id).length;
    const message = linkedEvents > 0
      ? `Delete this course and its ${linkedEvents} linked event(s)?`
      : 'Delete this course?';
    if (!window.confirm(message)) return;
    setData((previous) => ({
      courses: previous.courses.filter((course) => course.id !== id),
      events: previous.events.filter((event) => event.courseId !== id),
    }));
  }

  function deleteEvent(id) {
    if (!window.confirm('Delete this event?')) return;
    setData((previous) => ({
      ...previous,
      events: previous.events.filter((event) => event.id !== id),
    }));
    setDialog(null);
  }

  function courseLabel(courseId) {
    const course = courses.find((item) => item.id === courseId);
    return course ? `${course.department} ${course.code} - ${course.name}` : 'General';
  }

  const sortedEvents = [...events].sort((a, b) =>
    `${a.date}T${a.time}`.localeCompare(`${b.date}T${b.time}`)
  );
  const upcoming = sortedEvents.filter((event) => event.date >= todayKey()).slice(0, 5);
  const selectedEvent = dialog?.kind === 'details'
    ? events.find((event) => event.id === dialog.id)
    : null;

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-brand">▣ StudyFlow</div>
        <nav aria-label="Main navigation" className="side-nav">
          {['Dashboard', 'Courses', 'Calendar'].map((item) => (
            <button key={item} type="button" aria-current={page === item ? 'page' : undefined}
              className={`nav-link ${page === item ? 'active' : ''}`}
              onClick={() => setPage(item)}>{item}</button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="signed-in-label">{user.name}<span>{user.email}</span></div>
          <button type="button" className="secondary full" onClick={onLogout}>Log Out</button>
        </div>
      </aside>

      <main className="main-content">
        <header className="main-heading">
          <div>
            <h1>{page === 'Dashboard' ? `Welcome back, ${user.name.split(' ')[0]}!` : page}</h1>
            <p className="muted">
              {page === 'Courses' ? 'View and manage your courses.' : 'Keep track of your courses and events.'}
            </p>
          </div>
          <div className="top-actions">
            <button type="button" className="primary" onClick={() => setDialog({ kind: 'course' })}>
              + Add Course
            </button>
            <button type="button" className="secondary" onClick={() => setDialog({ kind: 'event' })}>
              + Add Event
            </button>
          </div>
        </header>

        {page === 'Courses' ? (
          <section className="section-card">
            <h2>Your Courses <span className="count">({courses.length})</span></h2>
            {courses.length === 0 ? (
              <p className="empty-state">No courses yet. Select Add Course to create your first one.</p>
            ) : (
              <div className="course-list">
                {courses.map((course) => (
                  <article key={course.id} className="course-item">
                    <div>
                      <h3>{course.department} {course.code}: {course.name}</h3>
                      <p className="muted">Section {course.section} · {course.professor}</p>
                    </div>
                    <button type="button" className="danger-text"
                      onClick={() => deleteCourse(course.id)}>Delete</button>
                  </article>
                ))}
              </div>
            )}
          </section>
        ) : (
          <div className="dashboard-grid">
            <CalendarView events={events}
              onAddOnDate={(date) => setDialog({ kind: 'event', date })}
              onEventClick={(event) => setDialog({ kind: 'details', id: event.id })} />
            <aside className="upcoming-panel">
              <h2>Upcoming Events</h2>
              {upcoming.length === 0 ? (
                <p className="empty-state">No upcoming events. Add one using the button above.</p>
              ) : (
                <ul className="upcoming-list">
                  {upcoming.map((event) => (
                    <li key={event.id}>
                      <button type="button" className="upcoming-entry"
                        onClick={() => setDialog({ kind: 'details', id: event.id })}>
                        <strong>{event.title}</strong>
                        <span>{formatDate(event.date)} · {formatTime(event.time)}</span>
                        <span>{courseLabel(event.courseId)}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              <div className="stats-line">
                <span>Courses: <strong>{courses.length}</strong></span>
                <span>Events: <strong>{events.length}</strong></span>
              </div>
            </aside>
          </div>
        )}
      </main>

      {dialog?.kind === 'course' && (
        <Dialog title="Add Course" onClose={() => setDialog(null)}>
          <CourseForm onSave={saveCourse} onCancel={() => setDialog(null)} />
        </Dialog>
      )}
      {dialog?.kind === 'event' && (
        <Dialog title="Add Event" onClose={() => setDialog(null)}>
          <EventForm courses={courses} initialDate={dialog.date}
            onSave={saveEvent} onCancel={() => setDialog(null)} />
        </Dialog>
      )}
      {selectedEvent && (
        <Dialog title="Event Details" onClose={() => setDialog(null)}>
          <div className="event-details">
            <h3>{selectedEvent.title}</h3>
            <p><strong>Type:</strong> {selectedEvent.type}</p>
            <p><strong>Course:</strong> {courseLabel(selectedEvent.courseId)}</p>
            <p><strong>Date:</strong> {formatDate(selectedEvent.date)}</p>
            <p><strong>Time:</strong> {formatTime(selectedEvent.time)}</p>
          </div>
          <div className="form-actions">
            <button type="button" className="secondary" onClick={() => setDialog(null)}>Close</button>
            <button type="button" className="danger" onClick={() => deleteEvent(selectedEvent.id)}>Delete Event</button>
          </div>
        </Dialog>
      )}
    </div>
  );
}
