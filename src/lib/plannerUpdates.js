import { assignCourseColor } from './courseColors.js';
import { EVENT_TYPES } from './eventTypes.js';


export function saveCourseRecord(courses, draft) {
  const previous = courses.find((course) => course.id === draft.id);
  const otherCourses = courses.filter((course) => course.id !== draft.id);

  let updated;
  if (previous?.colorSource === 'automatic' && draft.colorSource === 'automatic') {
    updated = { ...draft, color: previous.color, colorSource: 'automatic' };
  } else {
    updated = assignCourseColor(draft, otherCourses);
  }

  return previous
    ? courses.map((course) => (course.id === draft.id ? updated : course))
    : [...courses, updated];
}

export function saveEventRecord(events, draft) {
  return events.some((event) => event.id === draft.id)
    ? events.map((event) => (event.id === draft.id ? draft : event))
    : [...events, draft];
}

export function countEventsForCourse(events, courseId) {
  return events.filter((event) => event.courseId === courseId).length;
}


export function eventTypeCountsForCourse(events, courseId) {
  const counts = new Map();
  for (const event of events) {
    if (event.courseId !== courseId) continue;
    const type = event.type || 'Other';
    counts.set(type, (counts.get(type) || 0) + 1);
  }


  const types = [
    ...EVENT_TYPES,
    ...[...counts.keys()].filter((type) => !EVENT_TYPES.includes(type)).sort(),
  ];
  return types.filter((type) => counts.has(type))
    .map((type) => ({ type, count: counts.get(type) }));
}

export function deleteEventRecord(events, eventId) {
  return events.filter((event) => event.id !== eventId);
}
