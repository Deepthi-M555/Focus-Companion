# 🧠 FYNIX

> **A desktop productivity companion designed to help users manage tasks, plan focused work, run structured focus sessions, track productivity, and interact through voice.**

![Electron](https://img.shields.io/badge/Electron-Desktop-47848F?logo=electron&logoColor=white)
![React](https://img.shields.io/badge/React-Frontend-61DAFB?logo=react&logoColor=black)
![Node.js](https://img.shields.io/badge/Node.js-Backend-339933?logo=node.js&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-Database-47A248?logo=mongodb&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-Infrastructure-DC382D?logo=redis&logoColor=white)
![Python](https://img.shields.io/badge/Python-Voice%20Service-3776AB?logo=python&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green)

---

## 📖 Overview

FYNIX is a full-stack desktop productivity application designed to help users plan focused work, manage tasks, run structured focus sessions, monitor productivity, and interact with the application through voice.

The application combines a modern Electron desktop client with a Node.js backend, MongoDB persistence, Redis infrastructure, Socket.IO realtime communication, and a local Whisper-based voice service.

FYNIX is designed around the idea that productivity should be structured, measurable, and minimally distracting.

---

## ✨ Features

### 🎯 Focus Management

- Start structured focus sessions
- Pause and resume sessions
- Complete focus sessions
- Real-time session state
- Focus heartbeat tracking
- Session recovery
- Focus integrity tracking

---

### 📋 Task Management

- Create and manage tasks
- Track active tasks
- Organize daily work
- Prioritize tasks
- Complete tasks
- Review current tasks

---

### 📅 Smart Scheduling

- Generate structured schedules
- Organize tasks into time blocks
- Plan focused work sessions
- Review daily schedules
- Persist schedule information

---

### 📊 Productivity Analytics

- Focus statistics
- Focus hours
- Productivity trends
- Streak tracking
- Focus integrity
- Session analytics
- Cached analytics responses

---

### 🔐 Authentication

- User registration
- User login
- JWT-based authentication
- Protected API routes
- Session validation
- Persistent authentication
- Logout support

---

### ⚡ Redis Infrastructure

Redis is used for:

- Analytics caching
- Distributed locks
- API rate limiting
- User presence
- Socket.IO pub/sub
- Temporary realtime state

---

### 🔄 Realtime Communication

FYNIX uses Socket.IO for:

- Focus session events
- Heartbeats
- User presence
- Session recovery
- Overlay communication
- Realtime application updates

---

### 🎙️ Local Voice Interaction

FYNIX includes a local voice processing pipeline.

```text
Microphone
    ↓
Electron
    ↓
Node.js Voice API
    ↓
Local Whisper Service
    ↓
faster-whisper
    ↓
Transcription
    ↓
FYNIX