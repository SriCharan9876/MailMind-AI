# 🚀 MailMind AI – AI Powered Gmail Assistant

MailMind AI is a mini AI-powered email assistant built as part of the **Constructure AI Technical Assignment**.  
It integrates Google authentication, Gmail automation, and AI to help users **read, summarize, reply to, and delete emails** through a conversational chatbot interface.

---

## 🌐 Live Demo

**Frontend (Vercel):**  
[https://your-app-name.vercel.app](https://mail-mind-ai-vert.vercel.app)

**Backend API:**  
[https://your-backend-url.onrender.com](https://mailmind-ai-8pgp.onrender.com)

---

## 🧠 What This App Does

After logging in with Google, users can:

- 📥 Fetch last 5 emails  
- ✨ Get AI-generated summaries  
- ✍️ Generate professional AI replies  
- 📤 Send replies via Gmail  
- 🗑 Delete emails via natural commands  
- 💬 Interact through a chatbot-style dashboard  

---

## 🏗 Tech Stack

| Layer | Technology |
|------|-------------|
| Frontend | React + TypeScript + Tailwind CSS |
| Backend | FastAPI |
| AI Model | Groq (LLaMA 3.1) |
| Email API | Gmail API |
| Deployment | Vercel + Render |

---

## 🔐 Features Implemented

### ✅ Google Authentication
- OAuth2 login  
- Gmail read/send/delete permissions  

### ✅ Chatbot Dashboard
- Greets user  
- Explains capabilities  
- Displays chat thread  
- Accepts natural commands  

### ✅ Email Automation

| Feature | Description |
|---------|-------------|
| Read Emails | Fetches last 5 emails |
| AI Summary | Summarizes each email |
| AI Reply | Context-aware reply drafts |
| Send Reply | Sends via Gmail after confirmation |
| Delete Email | Deletes selected email |

---

## 📁 Project Structure

```
frontend/   → React UI  
backend/    → FastAPI server  
```

---

## ⚙️ Setup Instructions

### 🔹 1. Clone Repo

```bash
git clone https://github.com/yourusername/inboxpilot-ai.git
cd inboxpilot-ai
```

---

### 🔹 2. Backend Setup

```bash
cd backend
python -m venv venv
venv\Scripts\activate  # Windows
pip install -r requirements.txt
```

Create `.env`:

```
GROQ_API_KEY=your_groq_key
```

Run:

```bash
uvicorn main:app --reload
```

---

### 🔹 3. Frontend Setup

```bash
cd frontend
npm install
```

Create `.env`:

```
VITE_GOOGLE_CLIENT_ID=your_google_client_id
VITE_BACKEND_URL=http://localhost:8000
```

Run:

```bash
npm run dev
```

---

## 🔑 Google OAuth Setup

1. Go to Google Cloud Console  
2. Create OAuth Credentials  
3. Add scope:

```
https://www.googleapis.com/auth/gmail.modify
```

4. Add test user email:

```
testingcheckuser1234@gmail.com
```

---

## 🤖 AI Usage

AI is used for:

- Email summarization  
- Professional reply generation  

Prompts are structured to ensure context awareness and professional tone.

---

## 🧩 Assumptions

- Uses access token from Google OAuth implicit flow  
- Stores email context temporarily in memory (demo purpose)  
- Designed for assignment evaluation, not production scale  

---

## 🏁 Evaluation Focus

This project prioritizes:

- Functional Gmail integration  
- AI usefulness  
- Usable chatbot UX  
- Error handling for AI failures  

---

## 👨‍💻 Author

Sricharan  
AI + Full Stack Developer
