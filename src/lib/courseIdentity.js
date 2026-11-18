export function normalizeCoursePart(value) {
  return String(value ?? '').trim().replace(/\s+/g, ' ').toUpperCase();
}

export function sameCourseIdentity(a, b) {
  return normalizeCoursePart(a.department) === normalizeCoursePart(b.department)
    && normalizeCoursePart(a.code) === normalizeCoursePart(b.code)
    && normalizeCoursePart(a.section) === normalizeCoursePart(b.section);
}

export function findDuplicateCourse(courses, candidate) {
  return courses.find((course) => course.id !== candidate.id && sameCourseIdentity(course, candidate)) || null;
}

export function duplicateCourseMessage(course) {
  return `This course already exists: ${normalizeCoursePart(course.department)} ${normalizeCoursePart(course.code)}, Section ${normalizeCoursePart(course.section)}.`;
}
