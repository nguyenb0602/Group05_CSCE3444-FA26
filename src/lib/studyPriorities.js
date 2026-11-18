// Deterministic StudyFlow recommendations. No AI API calls or additional AWS resources.
// Heuristics, not a prediction of how long any student must study.
const EVENT_WEIGHT = { Exam: 30, Assignment: 23, 'Study Session': 12, Meeting: 4, Other: 7 };
const BASE_MINUTES = { 1: 70, 2: 55, 3: 40, 4: 25, 5: 15 };
const EVENT_MINUTES = { Exam: 10, Assignment: 5, 'Study Session': 0, Meeting: 0, Other: 0 };

export function confidenceValue(value) {
  const number = Number(value);
  return Number.isInteger(number) && number >= 1 && number <= 5 ? number : 3;
}

export function daysUntil(date, today) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{4}-\d{2}-\d{2}$/.test(today)) return null;
  const parse = (value) => {
    const [y, m, d] = value.split('-').map(Number);
    const ms = Date.UTC(y, m - 1, d);
    const actual = new Date(ms);
    return actual.getUTCFullYear() === y && actual.getUTCMonth() === m - 1 && actual.getUTCDate() === d ? ms : null;
  };
  const a = parse(date), b = parse(today);
  return a === null || b === null ? null : Math.round((a - b) / 86400000);
}

function urgencyScore(days) {
  if (days === 0) return 70;
  if (days === 1) return 62;
  if (days <= 3) return 52 - (days - 2) * 6;
  if (days <= 7) return 38 - (days - 4) * 3;
  return Math.max(8, 26 - (days - 8) * 2);
}

export function studyPriorities(courses, events, today, limit = 6) {
  const courseById = new Map(courses.map(course => [course.id, course]));
  return events.flatMap(event => {
    if (!event.courseId || !courseById.has(event.courseId)) return [];
    const days = daysUntil(event.date, today);
    if (days === null || days < 0 || days > 14) return [];
    const course = courseById.get(event.courseId);
    const confidence = confidenceValue(course.confidence);
    const score = urgencyScore(days) + (5 - confidence) * 11 + (EVENT_WEIGHT[event.type] ?? EVENT_WEIGHT.Other);
    return [{ event, course, confidence, days, score }];
  }).sort((a, b) => b.score - a.score || a.days - b.days || a.event.title.localeCompare(b.event.title))
    .slice(0, Math.max(0, Math.min(20, Number.isFinite(limit) ? Math.trunc(limit) : 6)));
}

function urgencyMinutes(days) {
  if (days === 0) return 30;
  if (days === 1) return 25;
  if (days <= 3) return 15;
  if (days <= 7) return 5;
  return 0;
}

function urgencyAdvice(days, type) {
  const task = type === 'Assignment';
  if (days === 0) return task
    ? 'Due today: work toward a finished, checked submission before doing optional review.'
    : 'Scheduled today: focus on the most useful practice and a final self-check.';
  if (days === 1) return 'Tomorrow: prioritize this session today instead of waiting until the last minute.';
  if (days <= 3) return 'Coming up soon: practice now and revisit any mistakes before the event.';
  if (days <= 7) return 'This week: spread the work across a few shorter sessions if possible.';
  return 'There is time to prepare: start with a manageable session and check progress again later.';
}

const EVENT_ACTIVITIES = {
  Exam: {
    apply: 'answer exam-style questions without looking at notes',
    check: 'check mistakes and list topics to revisit',
  },
  Assignment: {
    apply: 'complete the next concrete section of the assignment',
    check: 'check requirements, test your work, and prepare the submission',
  },
  'Study Session': {
    apply: 'practice the concepts planned for the session',
    check: 'write down remaining questions and next steps',
  },
  Meeting: {
    apply: 'prepare agenda items and specific questions',
    check: 'review the agenda and note any action items',
  },
  Other: {
    apply: 'work on the most important related task',
    check: 'verify what is complete and decide the next step',
  },
};

function preparationAdvice(confidence) {
  if (confidence === 1) return 'rebuild the fundamentals using notes and worked examples';
  if (confidence === 2) return 'review confusing topics with one or two examples';
  if (confidence === 3) return 'refresh the areas you cannot explain confidently';
  if (confidence === 4) return 'skim your weakest points, then move to practice';
  return 'do a quick topic checklist instead of rereading everything';
}

function studyFocus(confidence, days, type) {
  if (days === 0 && type === 'Assignment') return 'Finish and check the assignment';
  if (confidence <= 2) return 'Rebuild understanding and practice';
  if (confidence === 3) return 'Target weak areas and practice';
  if (confidence === 4) return 'Practice and correct mistakes';
  return 'Brief recall and readiness check';
}

// Returns a structured plan so the UI can show the time for each recommendation.
// Minutes are focused-work minutes; optional breaks are not included.
export function studyPlan(priority) {
  if (!priority) return null;
  const { event, days } = priority;
  const confidence = confidenceValue(priority.confidence);
  const safeDays = Number.isInteger(days) ? Math.max(0, Math.min(14, days)) : 14;
  const type = EVENT_ACTIVITIES[event?.type] ? event.type : 'Other';
  const totalMinutes = Math.min(110, BASE_MINUTES[confidence] + urgencyMinutes(safeDays) + EVENT_MINUTES[type]);
  const firstShare = confidence <= 2 ? 0.40 : confidence === 3 ? 0.25 : 0.15;
  const lastShare = confidence <= 2 ? 0.15 : 0.20;
  const firstMinutes = Math.max(5, Math.round(totalMinutes * firstShare / 5) * 5);
  const lastMinutes = Math.max(5, Math.round(totalMinutes * lastShare / 5) * 5);
  const middleMinutes = totalMinutes - firstMinutes - lastMinutes;
  const template = EVENT_ACTIVITIES[type];

  return {
    totalMinutes,
    confidence,
    days: safeDays,
    focus: studyFocus(confidence, safeDays, type),
    urgency: urgencyAdvice(safeDays, type),
    breakSuggestion: totalMinutes >= 45 ? 'Take a 5–10 minute break partway through; it is not included in the focused-work total.' : '',
    activities: [
      { minutes: firstMinutes, text: preparationAdvice(confidence) },
      { minutes: middleMinutes, text: template.apply },
      { minutes: lastMinutes, text: template.check },
    ],
  };
}

export function recommendationText(priority) {
  if (!priority) return 'Add a course and an upcoming event to get a personalized recommendation.';
  const { course, event, days, confidence } = priority;
  const plan = studyPlan(priority);
  const when = days === 0 ? 'today' : days === 1 ? 'tomorrow' : `in ${days} days`;
  const verb = event.type === 'Assignment' ? 'is due' : 'is scheduled';
  const steps = plan.activities.map(step => `${step.minutes} min to ${step.text}`).join('; ');
  return `Focus on ${course.department} ${course.code} (${course.name}). ` +
    `Your ${event.type.toLowerCase()} “${event.title}” ${verb} ${when}, and your confidence is ${confidence}/5. ` +
    `${plan.urgency} Suggested plan: ${plan.totalMinutes} minutes of focused work: ${steps}. ` +
    plan.breakSuggestion;
}

export function aiContext(courses, events, today) {
  return JSON.stringify({
    today,
    courses: courses.slice(0, 35).map(course => ({
      code: `${course.department} ${course.code}`,
      name: course.name,
      confidence: confidenceValue(course.confidence),
    })),
    upcomingEvents: events.filter(event => {
      const days = daysUntil(event.date, today);
      return days !== null && days >= 0 && days <= 30;
    }).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 50).map(event => ({
      title: event.title,
      type: event.type,
      date: event.date,
      course: (courses.find(course => course.id === event.courseId) || {}).name || 'General',
    })),
  });
}
