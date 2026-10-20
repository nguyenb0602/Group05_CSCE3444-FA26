import { useState } from 'react';
import { makeId } from '../lib/dates.js';

const emptyCourse = {
  name: '', 
  department: '', 
  code: '', 
  section: '', 
  professor: '',
};

export default function CourseForm({ onSave, onCancel }) {
  const [form, setForm] = useState(emptyCourse);

  function update(field, value) {
    setForm((previous) => ({ ...previous, [field]: value }));
  }

  function submit(event) {
    event.preventDefault();
    const course = {
      id: makeId(),
      name: form.name.trim(),
      department: form.department.trim().toUpperCase(),
      code: form.code.trim(),
      section: form.section.trim(),
      professor: form.professor.trim(),
    };
    if (Object.values(course).some((value) => !value)) return;
    onSave(course);
  }

  return (
    <form className="stack-form" onSubmit={submit}>
      <label>Course Name
        <input required maxLength={100} value={form.name}
          onChange={(e) => update('name', e.target.value)}
          placeholder="Software Engineering" />
      </label>
      <div className="two-fields">
        <label>Department
          <input required maxLength={12} value={form.department}
            onChange={(e) => update('department', e.target.value)}
            placeholder="CSCE" />
        </label>
        <label>Course Code
          <input required maxLength={20} value={form.code}
            onChange={(e) => update('code', e.target.value)}
            placeholder="3444" />
        </label>
      </div>
      <label>Section
        <input required maxLength={20} value={form.section}
          onChange={(e) => update('section', e.target.value)}
          placeholder="201" />
      </label>
      <label>Professor Name
        <input required maxLength={100} value={form.professor}
          onChange={(e) => update('professor', e.target.value)}
          placeholder="Dr. Smith" />
      </label>
      <div className="form-actions">
        <button type="button" className="secondary" onClick={onCancel}>Cancel</button>
        <button type="submit" className="primary">Save Course</button>
      </div>
    </form>
  );
}
