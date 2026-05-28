


| FE | Frontend Developer React · Vite · Tailwind CSS · Monaco Editor · Recharts · Socket.io |
| :---: | :---- |

You own everything the user sees and interacts with. Coordinate with the backend developer on the Socket.io event names and REST endpoint shapes before starting Phase 2 and 3\. Build against mock data first so you don't block on backend completion.

| Phase 1  Auth & Routing |
| :---- |

| Task | What to implement | Technology |
| :---- | :---- | :---- |
| **Login Page** | Email \+ password form; call POST /auth/login; store JWT in localStorage; redirect on success | React · axios |
| **Register Page** | Name, email, password, role selector; validate client-side; submit to POST /auth/register | React · React Hook Form |
| **Protected Routes** | HOC or wrapper that reads JWT; redirects to /login if missing or expired | React Router · JWT decode |
| **Auth Context** | Global useAuth hook; stores user object, role, and logout function across all pages | React Context API |
| **Token Refresh** | Intercept 401 responses; call refresh endpoint; retry original request automatically | axios interceptors |

| Phase 2  AI Chat Interface |
| :---- |

| Task | What to implement | Technology |
| :---- | :---- | :---- |
| **Chat Panel** | Message list scrolling to bottom; bubble UI for user vs AI messages; timestamp display | React · Tailwind CSS |
| **Streaming Display** | Listen to chat:stream socket event; append characters to last message in state as they arrive | Socket.io client · useState |
| **Message Input** | Text area with send on Enter; disable while AI is streaming; show typing indicator | React · Tailwind CSS |
| **Conversation History** | Load prior messages from GET /sessions/:id/messages on room join; render in order | React · axios |
| **AI Typing Indicator** | Show animated dots when chat:streaming state is true; hide on chat:done event | React state · CSS animation |
| **Error Toast** | Show dismissible error banner on chat:error socket event; auto-dismiss after 5 seconds | React · Tailwind CSS |

| Phase 3  Code Editor & Execution |
| :---- |

| Task | What to implement | Technology |
| :---- | :---- | :---- |
| **Monaco Editor** | Embed @monaco-editor/react; set theme to vs-dark; configure tab size and font size | Monaco Editor · React |
| **Language Picker** | Dropdown for Python, JavaScript, Java, C++, Go; switching updates Monaco language mode | React · Monaco API |
| **Run Button** | Emit code:submit event with code \+ language; disable button while execution is pending | Socket.io client · React |
| **Output Panel** | Display stdout/stderr/status from code:result event; colour-code errors vs success | React · Tailwind CSS |
| **Auto-save** | Debounce 1 second after last keystroke; emit code:save to backend for persistence | Socket.io · lodash debounce |
| **Execution Status** | Show spinner while awaiting result; show TLE warning if Judge0 returns time limit exceeded | React state · Tailwind |

| Phase 4  Interview Room & Session |
| :---- |

| Task | What to implement | Technology |
| :---- | :---- | :---- |
| **Split-pane Layout** | Left: Monaco editor \+ output; Right: AI chat panel; resizable with drag handle | React · Tailwind CSS |
| **Session Timer** | Countdown from 60 minutes; read from session state; turn red in last 5 minutes | React · setInterval |
| **Socket Connection** | Connect on room join; handle connect/disconnect/reconnect lifecycle; show status badge | Socket.io client · useSocket |
| **Room Join Flow** | Extract room code from URL param; emit session:join; wait for session:start ack | React Router · Socket.io |
| **Reconnection UI** | Show banner on disconnect; auto-reconnect attempts; restore editor content from state | Socket.io · React state |
| **Session End Flow** | Trigger session:end; navigate to evaluation page; block further submissions | Socket.io · React Router |

| Phase 5  Analytics Dashboard |
| :---- |

| Task | What to implement | Technology |
| :---- | :---- | :---- |
| **Overview Cards** | Total interviews, average score, languages used — fetched from GET /analytics/overview | React · axios · Tailwind |
| **Score Chart** | Bar chart of scores per session over time from analytics data | Recharts BarChart |
| **Language Breakdown** | Pie chart of most-used languages across all candidate sessions | Recharts PieChart |
| **Session History Table** | Paginated table: date, duration, score, status, link to transcript | React · Tailwind CSS |
| **Evaluation Report** | Dedicated page: AI feedback paragraph, metric scores (comm/problem/code), badge summary | React · Tailwind CSS |
| **Activity Timeline** | Chronological list of events in a session (question asked, code run, AI reply) | React · Tailwind CSS |

# **Shared API Contract**

These are the interfaces between backend and frontend. Agree on these before starting Phase 2 development. Backend implements; frontend consumes.

## **REST Endpoints**

| Method | Path | Description | Owner |
| ----- | :---- | :---- | :---- |
| **POST** | /auth/register | Register user — returns JWT \+ user object | Backend creates / Frontend calls |
| **POST** | /auth/login | Login — returns access \+ refresh tokens | Backend creates / Frontend calls |
| **POST** | /auth/refresh | Exchange refresh token for new access token | Backend creates / Frontend calls |
| **POST** | /sessions | Create interview session — returns room code | Backend creates / Frontend calls |
| **GET** | /sessions/:id | Get session details, status, timestamps | Backend creates / Frontend calls |
| **GET** | /sessions/:id/messages | Get full message history for a session | Backend creates / Frontend calls |
| **PATCH** | /sessions/:id/end | Mark session as completed | Backend creates / Frontend calls |
| **GET** | /analytics/overview | Aggregate stats: totals, averages, languages | Backend creates / Frontend calls |
| **GET** | /analytics/sessions | Paginated session list for current user | Backend creates / Frontend calls |
| **GET** | /evaluations/:sessionId | Get AI evaluation scores and feedback | Backend creates / Frontend calls |

## **Socket.io Events**

| Event name | Direction | Payload / Purpose | Owner |
| :---- | ----- | :---- | :---- |
| session:join | Client → Server | { sessionId, token } — join interview room | FE emits / BE handles |
| session:start | Server → Client | { sessionId, startedAt } — session is live | BE emits / FE listens |
| session:end | Client → Server | { sessionId } — candidate ends session | FE emits / BE handles |
| session:timer | Server → Client | { remaining: seconds } — every 60 seconds | BE emits / FE listens |
| chat:message | Client → Server | { sessionId, content } — send user message | FE emits / BE handles |
| chat:stream | Server → Client | { chunk, sessionId } — AI token chunk | BE emits / FE listens |
| chat:done | Server → Client | { sessionId } — stream complete | BE emits / FE listens |
| chat:error | Server → Client | { message } — AI or server error | BE emits / FE listens |
| code:submit | Client → Server | { sessionId, language, code } — run code | FE emits / BE handles |
| code:result | Server → Client | { stdout, stderr, status, time\_ms } | BE emits / FE listens |
| user:online | Server → Client | { userId } — peer connected to room | BE emits / FE listens |
| user:offline | Server → Client | { userId } — peer disconnected from room | BE emits / FE listens |

# **Delivery Timeline**

Both roles work in parallel. The contract in the previous section defines the shared interfaces — agree on these at the start of each phase so neither person blocks the other.

| Phase | Backend | Frontend |
| :---: | ----- | ----- |
| **Week 1–2** | DB schema \+ migrations, auth routes (register/login/JWT), Socket.io bootstrap, Docker Compose with postgres \+ redis | React \+ Vite scaffold, Tailwind setup, login/register pages, protected routes, auth context \+ token storage |
| **Week 3** | Claude API streaming integration, chat:stream Socket.io handler, conversation history, Judge0 Docker setup \+ code execution endpoint | Monaco Editor integration, language picker, AI chat panel with streaming display, code run button \+ output panel |
| **Week 4** | Session management API, reconnect logic, AI evaluation endpoint, analytics SQL queries | Interview room split-pane layout, session timer, reconnection UI, analytics dashboard with Recharts |
| **Week 5** | Performance testing, error handling hardening, seed scripts, API documentation | Evaluation report page, activity timeline, cross-browser testing, final UI polish |

## **Definition of Done**

* **All Socket.io events tested with multiple concurrent browser tabs**

* AI streaming works end-to-end: message sent, tokens stream, full response saved to DB

* Code execution returns correct output for Python, JavaScript, and at least one compiled language

* Auth flow: register, login, protected route redirect, token refresh all working

* Analytics dashboard shows real data from the database — no hardcoded values

* **Docker Compose brings up the entire stack with a single command on a clean machine**

