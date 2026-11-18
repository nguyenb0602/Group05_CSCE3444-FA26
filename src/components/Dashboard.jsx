import { useEffect, useRef, useState } from 'react';
import CalendarView from './CalendarView.jsx';
import StudyAssistant from './StudyAssistant.jsx';
import CourseForm from './CourseForm.jsx';
import EventForm from './EventForm.jsx';
import EventsSection from './EventsSection.jsx';
import { formatDate, formatTime, todayKey } from '../lib/dates.js';
import { getPlannerRepository } from '../lib/cloudPlanner.js';
import { loadPlannerData } from '../lib/storage.js';
import { importLegacyPlannerData } from '../lib/legacyImport.js';
import { eventColor } from '../lib/courseColors.js';
import { eventTypeCountsForCourse, saveCourseRecord } from '../lib/plannerUpdates.js';
import { eventTypeCountLabel } from '../lib/eventTypes.js';
import { courseLabel, sortEvents } from '../lib/eventSorting.js';

function Dialog({ title, onClose, children }) {
  const dialogRef = useRef(null);
  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
    return () => { if (dialog?.open) dialog.close(); };
  }, []);
  return (
    <dialog ref={dialogRef} className="app-dialog" aria-label={title}
      onCancel={(event) => { event.preventDefault(); onClose(); }}>
      <div className="dialog-heading">
        <h2>{title}</h2>
        <button type="button" className="icon-button secondary" aria-label="Close dialog" onClick={onClose}>×</button>
      </div>
      {children}
    </dialog>
  );
}

export default function Dashboard({ user, onLogout }) {
  const plannerRepository = getPlannerRepository();
  const [data, setData] = useState({ courses: [], events: [] });
  const [synced, setSynced] = useState({ courses: false, events: false });
  const [syncError, setSyncError] = useState('');
  const [syncAttempt, setSyncAttempt] = useState(0);
  const [working, setWorking] = useState(false);
  const [actionError, setActionError] = useState('');
  const [legacyData] = useState(() => loadPlannerData(user.email));
  const [legacyDismissed, setLegacyDismissed] = useState(false);
  const [importMessage, setImportMessage] = useState('');
  const [page, setPage] = useState('Dashboard');
  const [dialog, setDialog] = useState(null);
  const [upcomingVisible, setUpcomingVisible] = useState(true);
  const { courses, events } = data;

  useEffect(() => {
    let active = true;
    setSynced({ courses: false, events: false });
    setSyncError('');
    const callbacks = {
      onCourses: (items, isSynced) => {
        if (!active) return;
        setData(previous => ({ ...previous, courses: items }));
        setSynced(previous => ({ ...previous, courses: Boolean(isSynced) }));
      },
      onEvents: (items, isSynced) => {
        if (!active) return;
        setData(previous => ({ ...previous, events: items }));
        setSynced(previous => ({ ...previous, events: Boolean(isSynced) }));
      },
      onError: (error) => {
        if (active) setSyncError(error?.message || 'Cloud synchronization failed.');
      },
    };
    let unsubscribe = () => {};
    try {
      unsubscribe = plannerRepository.subscribe(callbacks);
    } catch (error) {
      setSyncError(error.message || 'Could not connect to your cloud data.');
    }
    return () => { active = false; unsubscribe(); };
  }, [user.id, syncAttempt]);

  const cloudReady = synced.courses && synced.events;

  async function saveCourse(draft) {
    setActionError('');
    const editing = courses.some(course => course.id === draft.id);
    const next = saveCourseRecord(courses, draft).find(course => course.id === draft.id);
    await plannerRepository.saveCourse(next, editing);
    setDialog(null);
  }

  async function saveEvent(draft) {
    setActionError('');
    if (draft.courseId && !courses.some(course => course.id === draft.courseId)) {
      throw new Error('The selected course is no longer available. Please choose a different course.');
    }
    const editing = events.some(event => event.id === draft.id);
    await plannerRepository.saveEvent(draft, editing);
    setDialog(null);
  }

  async function deleteCourse(id) {
    if (working) return;
    const linkedEvents = events.filter(event => event.courseId === id).length;
    const message = linkedEvents > 0
      ? `Delete this course and its ${linkedEvents} linked event(s)?`
      : 'Delete this course and any of its linked events?';
    if (!window.confirm(message)) return;
    setWorking(true);
    setActionError('');
    try {
      await plannerRepository.deleteCourse(id);
    } catch (error) {
      setActionError(error.message || 'Could not delete the course.');
    } finally {
      setWorking(false);
    }
  }

  async function deleteEvent(id) {
    if (working || !window.confirm('Delete this event?')) return;
    setWorking(true);
    setActionError('');
    try {
      await plannerRepository.deleteEvent(id);
      setDialog(null);
    } catch (error) {
      setActionError(error.message || 'Could not delete the event.');
    } finally {
      setWorking(false);
    }
  }
  async function importPreviousBrowserData() {
    if (working || !window.confirm('Import your old browser-stored courses and events into your signed-in cloud account? Existing cloud records will be kept.')) return;
    setWorking(true);
    setActionError('');
    setImportMessage('');
    try {
      const result = await importLegacyPlannerData({
        legacy: legacyData,
        courses,
        events,
        repository: plannerRepository,
      });
      setImportMessage(`Import complete: ${result.importedCourses} courses and ${result.importedEvents} events added.${result.skippedEvents ? ` ${result.skippedEvents} events were skipped because their course is missing.` : ''}`);
      setLegacyDismissed(true);
    } catch (error) {
      setActionError(`Import stopped: ${error.message || 'Unknown error'}. Your old browser data was not deleted; you can retry safely.`);
    } finally {
      setWorking(false);
    }
  }

  const upcoming = sortEvents(events, 'oldest', courses)
    .filter((event) => event.date >= todayKey()).slice(0, 5);
  const selectedEvent = dialog?.kind === 'details' ? events.find((event) => event.id === dialog.id) : null;
  const editingCourse = dialog?.kind === 'course' && dialog.id ? courses.find((course) => course.id === dialog.id) : null;
  const editingEvent = dialog?.kind === 'event' && dialog.id ? events.find((event) => event.id === dialog.id) : null;
  const openDetails = (event) => setDialog({ kind: 'details', id: event.id });
  const editEvent = (event) => setDialog({ kind: 'event', id: event.id });

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-brand">▣ StudyFlow</div>
        <nav aria-label="Main navigation" className="side-nav">
          {['Dashboard', 'Courses', 'Events', 'Study Assistant'].map((item) => (
            <button key={item} type="button" aria-current={page === item ? 'page' : undefined}
              className={`nav-link ${page === item ? 'active' : ''}`} onClick={() => setPage(item)}>{item}</button>
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
            <p className="muted">{page === 'Courses' ? 'View and manage your courses.' : page === 'Events' ? 'Browse every event and choose how to sort it.' : page === 'Study Assistant' ? 'Set your confidence and plan your study time.' : 'Keep track of your courses and events.'}</p>
          </div>
          <div className="top-actions">
            <button type="button" className="primary" disabled={!cloudReady || working} onClick={() => setDialog({ kind: 'course' })}>+ Add Course</button>
            <button type="button" className="secondary" disabled={!cloudReady || working} onClick={() => setDialog({ kind: 'event' })}>+ Add Event</button>
          </div>
        </header>

        {cloudReady && !legacyDismissed && (legacyData.courses.length > 0 || legacyData.events.length > 0) && (
          <section className="legacy-banner" aria-label="Import old study data">
            <div>
              <strong>Found your old browser data</strong>
              <p>Your earlier demo saved {legacyData.courses.length} courses and {legacyData.events.length} events only on this device. Import them into your cloud account?</p>
            </div>
            <div className="legacy-actions">
              <button type="button" disabled={working} className="secondary" onClick={importPreviousBrowserData}>Import to Cloud</button>
              <button type="button" disabled={working} className="text-button" onClick={() => setLegacyDismissed(true)}>Not now</button>
            </div>
          </section>
        )}
        {importMessage && <p className="sync-success" role="status">{importMessage}</p>}
        {actionError && <p role="alert" className="sync-error">{actionError}</p>}
        {syncError && (
          <div className="sync-error" role="alert">
            <p>Cloud connection problem: {syncError}</p>
            <button type="button" className="secondary" onClick={() => setSyncAttempt(attempt => attempt + 1)}>
              Retry connection
            </button>
          </div>
        )}
        {!cloudReady && !syncError ? (
          <div className="section-card" role="status" aria-live="polite">
            Loading your courses and events from AWS…
          </div>
        ) : !cloudReady ? null : page === 'Courses' ? (
          <section className="section-card">
            <h2>Your Courses <span className="count">({courses.length})</span></h2>
            {courses.length === 0 ? <p className="empty-state">No courses yet. Select Add Course to create your first one.</p> : (
              <div className="course-list">
                {courses.map((course) => (
                  <article key={course.id} className="course-item">
                    <div className="course-item-info">
                      <span className="course-color-dot" style={{ background: course.color }} aria-label={`Course color ${course.color}`} />
                      <div>
                        <h3>{course.department} {course.code}: {course.name}</h3>
                        <p className="muted">Section {course.section} · {course.professor}</p>
                        <div className="course-event-counts" aria-label="Events by type">
                          {eventTypeCountsForCourse(events, course.id).map(({ type, count }) => (
                            <span className="course-event-count" key={type}>{eventTypeCountLabel(type, count)}</span>
                          ))}
                        </div>
                        <span className="muted small course-color-description">{course.colorSource === 'custom' ? 'Custom color' : 'Auto-assigned color'}</span>
                      </div>
                    </div>
                    <div className="item-actions">
                      <button type="button" className="secondary" disabled={working} onClick={() => setDialog({ kind: 'course', id: course.id })} aria-label={`Edit ${course.department} ${course.code}`}>Edit</button>
                      <button type="button" className="danger-text" disabled={working} onClick={() => deleteCourse(course.id)} aria-label={`Delete ${course.department} ${course.code}`}>Delete</button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        ) : page === 'Events' ? (
          <EventsSection events={events} courses={courses} onEventClick={openDetails} onEditEvent={editEvent} onDeleteEvent={deleteEvent} disabled={working} />
        ) : page === 'Study Assistant' ? (
          <StudyAssistant courses={courses} events={events} onSaveCourse={saveCourse} />
        ) : (
          <>
            <div className="dashboard-secondary-actions">
              <button type="button" className="secondary sidebar-toggle" aria-expanded={upcomingVisible}
                onClick={() => setUpcomingVisible((visible) => !visible)}>
                {upcomingVisible ? 'Hide Upcoming Events' : 'Show Upcoming Events'}
              </button>
            </div>
            <div className={`dashboard-grid ${upcomingVisible ? '' : 'sidebar-hidden'}`}>
              <CalendarView events={events} courses={courses}
                onAddOnDate={(date) => setDialog({ kind: 'event', date })}
                onEventClick={openDetails} />
              {upcomingVisible && (
                <aside className="upcoming-panel" aria-label="Upcoming Events sidebar">
                  <h2>Upcoming Events</h2>
                  {upcoming.length === 0 ? <p className="empty-state">No upcoming events. Add one using the button above.</p> : (
                    <ul className="upcoming-list">
                      {upcoming.map((event) => (
                        <li key={event.id}>
                          <button type="button" className="upcoming-entry" onClick={() => openDetails(event)}>
                            <span className="upcoming-title"><span className="course-color-dot" style={{ background: eventColor(event, courses) }} /> <strong>{event.title}</strong></span>
                            <span>{formatDate(event.date)} · {formatTime(event.time)}</span>
                            <span>{courseLabel(event.courseId, courses)}</span>
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
              )}
            </div>
          </>
        )}
      </main>
      {dialog?.kind === 'course' && (
        <Dialog title={editingCourse ? 'Edit Course' : 'Add Course'} onClose={() => setDialog(null)}>
          <CourseForm key={editingCourse?.id || 'new-course'} initialCourse={editingCourse} onSave={saveCourse} onCancel={() => setDialog(null)} />
        </Dialog>
      )}
      {dialog?.kind === 'event' && (
        <Dialog title={editingEvent ? 'Edit Event' : 'Add Event'} onClose={() => setDialog(null)}>
          <EventForm key={editingEvent?.id || `new-event-${dialog.date || ''}`} courses={courses} initialDate={dialog.date} initialEvent={editingEvent} onSave={saveEvent} onCancel={() => setDialog(null)} />
        </Dialog>
      )}
      {selectedEvent && (
        <Dialog title="Event Details" onClose={() => setDialog(null)}>
          <div className="event-details">
            <h3><span className="course-color-dot" style={{ background: eventColor(selectedEvent, courses) }} /> {selectedEvent.title}</h3>
            <p><strong>Type:</strong> {selectedEvent.type}</p>
            <p><strong>Course:</strong> {courseLabel(selectedEvent.courseId, courses)}</p>
            <p><strong>Date:</strong> {formatDate(selectedEvent.date)}</p>
            <p><strong>Time:</strong> {formatTime(selectedEvent.time)}</p>
          </div>
          <div className="form-actions">
            <button type="button" className="secondary" onClick={() => setDialog(null)}>Close</button>
            <button type="button" className="primary" onClick={() => editEvent(selectedEvent)}>Edit Event</button>
            <button type="button" className="danger" onClick={() => deleteEvent(selectedEvent.id)}>Delete Event</button>
          </div>
        </Dialog>
      )}
    </div>
  );
}
