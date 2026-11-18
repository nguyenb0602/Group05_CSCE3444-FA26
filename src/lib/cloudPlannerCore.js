import { duplicateCourseMessage, findDuplicateCourse } from './courseIdentity.js';
import { confidenceValue } from './studyPriorities.js';

function checked(result, description) {
  if (result?.errors?.length) {
    throw new Error(`${description}: ${result.errors.map(e => e.message || String(e)).join('; ')}`);
  }
  if (!result || !result.data) {
    throw new Error(`${description}: the server returned no record.`);
  }
  return result.data;
}

export function mapCourse(record) {
  return {
    id: record.id,
    name: record.name || '',
    department: record.department || '',
    code: record.code || '',
    section: record.section || '',
    professor: record.professor || '',
    color: record.color || '#2563eb',
    colorSource: record.colorSource || 'automatic',
    confidence: confidenceValue(record.confidence),
  };
}

export function mapEvent(record) {
  return {
    id: record.id,
    title: record.title || '',
    type: record.type || 'Other',
    date: record.date || '',
    time: record.time || '09:00',
    courseId: record.courseId || '',
  };
}

export function createPlannerRepository(models) {
  return {
    // Subscriptions keep two signed-in browsers current when another device
    // creates, edits, or deletes data. They also fetch initial data.
    subscribe({ onCourses, onEvents, onError }) {
      let coursesSub;
      let eventsSub;
      try {
        coursesSub = models.Course.observeQuery().subscribe({
          next: ({ items, isSynced }) => onCourses(items.map(mapCourse), isSynced),
          error: onError,
        });
        eventsSub = models.Event.observeQuery().subscribe({
          next: ({ items, isSynced }) => onEvents(items.map(mapEvent), isSynced),
          error: onError,
        });
      } catch (error) {
        coursesSub?.unsubscribe();
        eventsSub?.unsubscribe();
        throw error;
      }
      return () => { coursesSub?.unsubscribe(); eventsSub?.unsubscribe(); };
    },

    async saveCourse(course, editing) {
      let nextToken = null;
      do {
        const page = await models.Course.list({
          limit: 100,
          ...(nextToken ? { nextToken } : {}),
        });
        if (page?.errors?.length) {
          throw new Error(`Checking existing courses: ${page.errors.map(e => e.message || String(e)).join('; ')}`);
        }
        if (!page || !Array.isArray(page.data)) {
          throw new Error('Could not check existing courses. Please try again.');
        }
        const duplicate = findDuplicateCourse(page.data, course);
        if (duplicate) throw new Error(duplicateCourseMessage(duplicate));
        nextToken = page.nextToken || null;
      } while (nextToken);

      const payload = {
        id: course.id,
        name: course.name,
        department: course.department,
        code: course.code,
        section: course.section,
        professor: course.professor,
        color: course.color,
        colorSource: course.colorSource,
        confidence: confidenceValue(course.confidence),
      };
      const result = editing
        ? await models.Course.update(payload)
        : await models.Course.create(payload);
      return mapCourse(checked(result, editing ? 'Updating course' : 'Creating course'));
    },

    async saveEvent(event, editing) {
      if (event.courseId) {
        // Owner authorization makes another user's course inaccessible.
        const course = await models.Course.get({ id: event.courseId });
        if (course?.errors?.length || !course?.data) {
          throw new Error('This course is unavailable to your account. Refresh your courses and try again.');
        }
      }
      const payload = {
        id: event.id,
        title: event.title,
        type: event.type,
        date: event.date,
        time: event.time,
        courseId: event.courseId || null,
      };
      const result = editing
        ? await models.Event.update(payload)
        : await models.Event.create(payload);
      return mapEvent(checked(result, editing ? 'Updating event' : 'Creating event'));
    },

    async deleteEvent(id) {
      checked(await models.Event.delete({ id }), 'Deleting event');
    },

    async deleteCourse(id) {
      // Fetch fresh linked events from AWS rather than relying on a potentially
      // stale sidebar count from a different device.
      let token = null;
      const ids = [];
      do {
        const response = await models.Event.list({
          filter: { courseId: { eq: id } },
          limit: 100,
          ...(token ? { nextToken: token } : {}),
        });
        if (response.errors?.length) {
          throw new Error(`Finding linked events: ${response.errors.map(e => e.message).join('; ')}`);
        }
        ids.push(...(response.data || []).map(event => event.id));
        token = response.nextToken || null;
      } while (token);
      for (const eventId of ids) {
        checked(await models.Event.delete({ id: eventId }), 'Deleting linked event');
      }
      checked(await models.Course.delete({ id }), 'Deleting course');
    },
  };
}
