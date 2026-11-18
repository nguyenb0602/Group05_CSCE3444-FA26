// Course and event records are stored only in this browser until the
// app is migrated to a cloud data API. Accounts and passwords are
// exclusively handled by AWS Cognito, not by this module.

function readJSON(key, fallback) {
  try {
    const text = localStorage.getItem(key);
    return text ? JSON.parse(text) : fallback;
  } catch {
    return fallback;
  }
}

function saveJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn('Could not save planner data in browser storage:', error);
  }
}

// Retains the previous key so this browser's existing courses/events survive.
function dataKey(email) {
  return `studyplanner_demo_data_v1_${encodeURIComponent(email.trim().toLowerCase())}`;
}

export function loadPlannerData(email) {
  const data = readJSON(dataKey(email), { courses: [], events: [] });
  return {
    courses: Array.isArray(data?.courses) ? data.courses : [],
    events: Array.isArray(data?.events) ? data.events : [],
  };
}

export function savePlannerData(email, data) {
  saveJSON(dataKey(email), data);
}
