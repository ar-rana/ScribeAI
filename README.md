# ScribeAI: Real-Time AI-Powered Meeting Transcription

ScribeAI is a full-stack Next.js & Node.js application designed to provide real-time audio scribing and post-session summarization for meetings, tab or mic recordings. It uses the Gemini API for live transcription and is architected to handle long-duration sessions robustly via chunked streaming and Socket.io for low-latency status updates.

---

## Features

1.  **Real-Time Transcription:** Capture audio from **microphone input** or **shared meeting tabs** the transcribe them in real time using **Gemini API**.
2.  **Handle Long Sessions:** Can handle sessions for **1 hour or more** of recording time using chunked audio streaming depending on user's machine.
3.  **Resilient Streaming:** Handles graceful reconnect and data persistence.
4.  **Post-Processing:** Get **Summary**, **Transcript** of your Audio.
5.  **Low-Latency UI:** Use **Socket.io** for real-time transcription.
6.  **Reording Controls:** Manage state of you recording (`play`, `paused`, `stop/finish`, `reset`) within the UI.

---

## Tech Stack

| Component | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend/Backend** | Next.js 14+ (App Router) & TypeScript + Node.js & Socket.io | Full-stack application framework. |
| **Database** | PostgreSQL with Prisma ORM | Persistent storage for recordings, transcripts and user data. |
| **AI Integration** | Google Gemini API | For live transcription and summarization. |
| **Authentication** | Better Auth | User management and security. |
| **Styling** | Tailwind CSS | Responsive UI with dark mode. |

### Main Dashboard Interface
<img width="1898" height="747" alt="image" src="https://github.com/user-attachments/assets/963ddaf1-90b4-4586-87f0-ad8109f5c0fe" />

---

## Quick Setup

1. **Clone this Repository**
2. Add the Following Environment Variables:
```
DATABASE_URL=postgresql://root:myperfectpassword@localhost:5433/SCRIBEAI_DB
GEMINI_API_KEY=YourGeminiAPIKey
BETTER_AUTH_SECRET=YourBetterAuthSecret
BETTER_AUTH_URL=http://localhost:3333
GOOGLE_CLIENT_ID=YourGoogleClientID
GOOGLE_CLIENT_SECRET=YourGoogleClientSecret
```
### Backend & Database Setup
- Go to Server: ```cd server```
- Run Docker: ```docker-compose up --build```
- Setup Prisma:
  ```
  npx prisma migrate dev --name init
  npx prisma generate
  ```
- Run Application: ```npm run dev```
### Frontend Setup
- Go to Client: ```cd client```
- Run Application: ```npm run dev```

---

## Architecture Comparison: Streaming vs. Upload

This project utilizes a **streaming architecture** to meet the low-latency, real-time transcription requirement. The following table compares the decision against a simpler full-file upload model:

| Feature | Streaming (Chosen) | Full-File Upload | Key Decision |
| :--- | :--- | :--- | :--- |
| **Latency** | **Very Low** (real-time feedback) | High (full upload + full transcription delay) | Essential for real-time requirement. |
| **Reliability**| Complex; requires resilient socket and retry logic. Some chunks may be lost. | High; file integrity is simpler to manage. | MediaRecorder for chunked streaming (mainly due to time constraint). |
| **Scalability** | Good for lrage number of users and large-audio file | Poor for long sessions or alot of users. | Chunked processing solves long-session memory issues. |
| **UX** | Continuous, live transcript updates. | Transcript provided only after the session ends. Takes longer to process. | Better user experience and user friendly. |

---

## Long-Session Scalability

ScribeAI is designed to last for long-session durations of upto 1 hour or more, I decided to use MediaRecorder over WebRTC primarily because before this project there were alot of requirements of this project that I had never worked with like XState, Audio Streaming, WebRTC and due to the time constraint specifically for me during exam time, learning a new framework like WebRTC would not work, thus I picked MediaRecorder. 

I handle long-session duration by sending smaller chunks of audio (like 6sec), and get them transcribed, the transcription is collected on the frontend and displayed to the user live. the length of the session also depends on the users machine, because I may send chunked audio, which reduces memory overhead, but in my application I have also implemented a audio 'playback functionality' which buffers the audio in the users memory. Without this playback functionality we can indefinity send continuous audio chunks to the server and get their transcription if we don't save the audio chunks.

But to ensure that the data is not lost even during connection interruptions we will have to store this audio somewhere to send it back for transcription after the connection is stable again. So for long-sessions my architecture can essentially persist, for as long as the users machine allows due to the playback functionality, if we remove that we can send audio for transcription indefinity if we choose not to store all the chunks.

---

## Stream Pipeline Flow Diagram
<img width="1184" height="587" alt="image" src="https://github.com/user-attachments/assets/21b8de91-d742-4815-85ed-5f13c7115055" />

