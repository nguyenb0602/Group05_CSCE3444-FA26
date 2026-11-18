import {useState} from 'react';
import {aiContext,confidenceValue,recommendationText,studyPlan,studyPriorities} from '../lib/studyPriorities.js';
import {askStudyCoach} from '../lib/studyCoachClient.js';
import {todayKey} from '../lib/dates.js';

export default function StudyAssistant({courses,events,onSaveCourse}) {
  const [draft,setDraft] = useState('');
  const [messages,setMessages] = useState([]);
  const [busy,setBusy] = useState(false);
  const [error,setError] = useState('');
  const [updating,setUpdating] = useState('');
  const today = todayKey();
  const priorities = studyPriorities(courses,events,today);
  async function changeConfidence(course,newValue) {
    if (updating) return;
    setError(''); setUpdating(course.id);
    try { await onSaveCourse({...course,confidence:Number(newValue)}); }
    catch(e) {setError(e.message || 'Could not save confidence rating.');}
    finally {setUpdating('');}
  }
  async function send(event) {
    event.preventDefault();
    const question = draft.trim();
    if (!question || busy) return;
    setBusy(true); setError(''); setDraft('');
    const previous = messages;
    setMessages([...previous,{role:'student',text:question}]);
    try {
      const context = aiContext(courses,events,today) + '\nRecent conversation: '+ JSON.stringify(previous.slice(-6));
      const answer = await askStudyCoach(question.slice(0,800),context.slice(0,6500));
      setMessages(history => [...history,{role:'assistant',text:answer}]);
    } catch(e) {
      setError(e.message || 'AI is currently unavailable. You can still use the study priority recommendations.');
    } finally {setBusy(false);}
  }
  return (
    <section className="study-section" aria-label="Study Assistant">
      <div className="section-card study-card">
        <h2>Study priorities</h2>
        <p className="muted">Based on your upcoming exams, assignments, and confidence ratings. These recommendations work without an AI service.</p>
        {priorities.length ? <>
          <p role="status" className="study-spotlight">{recommendationText(priorities[0])}</p>
          <ol className="study-ranked">
            {priorities.map((priority) => {
              const {event,course,days,confidence} = priority;
              const plan = studyPlan(priority);
              return <li key={event.id}>
                <strong>{course.department} {course.code}: {event.title}</strong>
                <span className="muted">{event.type} · {days===0?'Today':days===1?'Tomorrow':`${days} days away`} · Confidence {confidence}/5</span>
                <span className="muted">Suggested: {plan.totalMinutes} min focused work · {plan.focus}</span>
              </li>;
            })}
          </ol>
        </>:<p className="empty-state">Add an upcoming course event to see priorities here.</p>}
      </div>
      <div className="section-card study-card">
        <h2>How confident are you?</h2>
        <p className="muted">1 = very unsure, 5 = very confident. Ratings are saved with your cloud courses.</p>
        {courses.length === 0 ? <p className="empty-state">Add a course first.</p> :
          <div className="study-confidence-list">{courses.map(course=><label key={course.id} className="study-confidence-row">
            <span>{course.department} {course.code}: {course.name}</span>
            <select aria-label={`Confidence for ${course.department} ${course.code}`} value={confidenceValue(course.confidence)} disabled={Boolean(updating)}
              onChange={e=>changeConfidence(course,e.target.value)}>
              {[1,2,3,4,5].map(n=><option key={n} value={n}>{n} / 5</option>)}
            </select>
          </label>)}</div>}
      </div>
      <div className="section-card study-card">
        <h2>Ask Gemini</h2>
        <p className="muted">Ask about specific concepts or request a study schedule.</p>
        <div className="study-chat" aria-label="AI conversation" aria-live="polite">
          {messages.length === 0 ? <p className="muted">Example: “I struggle with recursion and have two hours tonight. What should I study?”</p> : messages.map((message,index)=><div key={index} className={`study-message ${message.role}`}>
            <strong>{message.role==='student'?'You':'AI coach'}</strong>
            <p>{message.text}</p>
          </div>)}
        </div>
        {error && <p className="error-message" role="alert">{error}</p>}
        <form onSubmit={send} className="study-chat-form">
          <label htmlFor="study-question">Your question</label>
          <textarea id="study-question" rows="3" maxLength="800" value={draft} onChange={e=>setDraft(e.target.value)} placeholder="What should I study tonight?" />
          <button type="submit" className="primary" disabled={busy || !draft.trim()}>{busy?'Asking…':'Ask Gemini'}</button>
        </form>
        <p className="muted small">Avoid entering sensitive personal details. Google may use submitted content to improve their services.</p>
      </div>
    </section>
  );
}
