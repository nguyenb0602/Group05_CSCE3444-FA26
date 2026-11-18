import { saveCourseRecord } from './plannerUpdates.js';

export async function importLegacyPlannerData({ legacy, courses, events, repository }) {
  const knownCourseIds = new Set(courses.map(course => course.id));
  const knownEventIds = new Set(events.map(event => event.id));
  let mergedCourses = [...courses];
  let importedCourses = 0;
  let importedEvents = 0;
  let skippedEvents = 0;

  for (const draft of legacy.courses || []) {
    if (!draft?.id || knownCourseIds.has(draft.id)) continue;
    const assigned = saveCourseRecord(mergedCourses, {
      ...draft,
      color: draft.color || null,
      colorSource: draft.colorSource || 'automatic',
    }).find(course => course.id === draft.id);
    await repository.saveCourse(assigned, false);
    mergedCourses.push(assigned);
    knownCourseIds.add(draft.id);
    importedCourses++;
  }
  for (const draft of legacy.events || []) {
    if (!draft?.id || knownEventIds.has(draft.id)) continue;
    if (draft.courseId && !knownCourseIds.has(draft.courseId)) {
      skippedEvents++;
      continue;
    }
    await repository.saveEvent(draft, false);
    knownEventIds.add(draft.id);
    importedEvents++;
  }
  return { importedCourses, importedEvents, skippedEvents };
}
