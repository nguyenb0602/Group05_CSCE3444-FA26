import { useState } from 'react';
import { makeId, todayKey } from '../lib/dates.js';

const EVENT_TYPES = ['Assignment', 'Exam', 'Study Session', 'Meeting', 'Other'];

export default function EventForm({ courses, initialDate, onSave, onCancel }) {
  const [form, setForm] = useState({
    title: '',
    courseId: '',
    type: 'Assignment',
    date: initialDate || todayKey(),
    time: '11:59',
  });

  function update(field, value) {
    setForm((previous) => ({ ...previous, [field]: value }));
  }

  function submit(event) {
    event.preventDefault();
    if (!form.title.trim() || !form.date || !form.time) return;
    onSave({ ...form, id: makeId(), title: form.title.trim() });
  }

  return (
    <form className="stack-form" onSubmit={submit}>
      <label>Event Title
        <input required maxLength={120} value={form.title}
          onChange={(e) => update('title', e.target.value)}
          placeholder="Pop Quiz" />
      </label>
      <label>Course (optional)
        <select value={form.courseId} onChange={(e) => update('courseId', e.target.value)}>
          <option value="">General event / no course</option>
          {courses.map((course) => (
            <option key={course.id} value={course.id}>
              {course.department} {course.code} - {course.name}
            </option>
          ))}
        </select>
      </label>
      <label>Event Type
        <select value={form.type} onChange={(e) => update('type', e.target.value)}>
          {EVENT_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
        </select>
      </label>
      <div className="two-fields">
        <label>Date
          <input required type="date" value={form.date}
            onChange={(e) => update('date', e.target.value)} />
        </label>
        <label>Time
          <input required type="time" value={form.time}
            onChange={(e) => update('time', e.target.value)} />
        </label>
      </div>
      <div className="form-actions">
        <button type="button" className="secondary" onClick={onCancel}>Cancel</button>
        <button type="submit" className="primary">Save Event</button>
      </div>
    </form>
  );
}
