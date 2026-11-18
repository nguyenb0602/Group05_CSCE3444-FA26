# Group05_CSCE3444-FA26
**Team Name**: Team 5

**Project Idea**: A web application that helps students study and keep track of their courses, course concepts, and coursework. It will also have a dashboard view to better enable students to plan. 

**Team Members**:
- Bryan Nguyen - Team Lead
- Oneal Egwuatu - Developer
- Tristan Okine - Developer

**Github Project Link**: https://github.com/nguyenb0602/Group05_CSCE3444-FA26/projects

**StudyFlow Link**: https://main.dns9o38seaqsz.amplifyapp.com/

**Current Status**: Complete.

# StudyFlow

StudyFlow is a web-based academic planner that helps students organize courses, manage deadlines, and decide what to study next. It combines course and event management, a calendar, and a Study Assistant in one application.

## Features

- **Secure sign-in:** Create an account, verify an email address, sign in, reset a password, and log out using Amazon Cognito. Sign-up includes email-domain typo suggestions and a minimum password length of 10 characters.
- **Cloud synchronization:** Save courses and events through AWS AppSync and DynamoDB so the same account can access them across devices. Owner-based authorization limits access to each user's records.
- **Course management:** Add, edit, and delete courses, including their department, code, section, professor, and name. Check for duplicate department/code/section combinations.
- **Course colors:** Choose a color for each course or let StudyFlow assign an available color. Linked events use the course's color.
- **Event management:** Add, edit, delete, and sort assignments, exams, meetings, study sessions, and other events. Course cards show live event counts by type, hiding types with zero events.
- **Calendar:** Switch between month, week, and day views, and show or hide the Upcoming Events sidebar.
- **Adaptive Study Assistant:** Rate confidence in each course from 1 to 5. StudyFlow ranks upcoming events by deadline urgency, confidence, and event type, then suggests a focused-study duration and three timed activities suited to the student's preparation level. Each priority item also shows its suggested time and focus.
- **Optional AI chat:** When configured, a Gemini-powered assistant can discuss study guides and schedules using course and upcoming-event context.
- **Automated testing:** Helper tests cover selected date, course, event, cloud-data, and study-recommendation behavior.

## Technology

- **Frontend:** React, JavaScript, Vite, CSS
- **Authentication:** Amazon Cognito
- **Backend:** AWS Amplify Gen 2, AWS AppSync, Amazon DynamoDB
- **Hosting:** AWS Amplify Hosting with GitHub integration
- **Optional AI:** AWS Lambda and Google Gemini API

## Getting Started

1. Clone the repository and open it in VS Code.
2. Run `npm install` to install dependencies.
3. Configure or deploy the Amplify Gen 2 backend, and generate or obtain `amplify_outputs.json` for your environment.
4. Run `npm run dev` to start StudyFlow locally.

Deploying backend resources requires AWS credentials and appropriate permissions. Keep credentials and API keys out of the repository.

## How Study Recommendations Work

StudyFlow's built-in recommendations do not require an AI API call. They use a rule-based algorithm that considers:

- **Confidence:** Low ratings (1–2/5) lead to more time rebuilding fundamentals and practicing. Medium confidence (3/5) emphasizes targeted review and exercises. High ratings (4–5/5) lead to shorter recall and readiness checks.
- **Deadline urgency:** Events due today or tomorrow generally receive higher priority and more suggested study time than events farther away.
- **Event type:** Exams emphasize practice questions; assignments emphasize completing work and checking requirements. Other event types receive relevant activities.

The assistant provides three timed steps for each recommended session, plus an optional break suggestion. **Suggested minutes are focused-work time; breaks are not included.** Durations are planning guidelines, not guaranteed optimal study times.

## Limitations

- **Course-wide confidence:** Ratings apply to entire courses, not individual topics or skills.
- **Rule-based planning:** Suggestions use fixed heuristics; they do not yet account for the student's actual available study hours, learning pace, or completed study sessions.
- **14-day priority window:** The built-in ranked list considers course-linked events within the next 14 days. Study plans are advisory and are not automatically added to the calendar.
- **Optional AI dependencies:** AI conversation requires a configured Lambda backend and Gemini API access; availability, quotas, and charges depend on the services used.
- **No external calendar sync:** Google Calendar and Canvas Calendar integration are not yet implemented.
- **Cloud dependence and further testing:** Authentication and synchronized records require internet connectivity and AWS availability. Simultaneous duplicate-course submissions are not prevented by an atomic uniqueness constraint. Continued accessibility, security, and end-to-end testing is recommended.

## Future Improvements

- Add topic-level confidence tracking, user-defined available study time, and the ability to review and save suggested study sessions to the calendar.
- Integrate Google Calendar and Canvas Calendar for importing or synchronizing deadlines and events.

StudyFlow is a student software engineering project. The AWS backend and optional AI integration must be configured for the relevant features to operate.
