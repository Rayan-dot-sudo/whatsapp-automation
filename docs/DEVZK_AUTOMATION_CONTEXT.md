# 🚀 Devzk WhatsApp AI Automation — Master System Documentation & Context

> **Project Name:** Devzk WhatsApp AI Automation 24/7  
> **Agency:** Devzk (Software, Web, AI & Creative Media Agency)  
> **Founder & CEO:** Muhammad Ryan Zubair  
> **Co-Founder & COO:** Muhammad Toseef  
> **Connected WhatsApp Number:** `+923079235242`  
> **Live Cloud Dashboard:** [https://rayan728.alwaysdata.net/](https://rayan728.alwaysdata.net/)  
> **GitHub Repository:** [https://github.com/Rayan-dot-sudo/whatsapp-automation.git](https://github.com/Rayan-dot-sudo/whatsapp-automation.git)  
> **Last Updated:** October 2026  

---

## 📌 Executive Summary
This document preserves the complete context, architecture, operational logic, security policies, and upgrade instructions for the Devzk WhatsApp AI Automation system. Whenever new features, prompt tweaks, service updates, or code changes are required in the future, this file serves as the single source of truth.

---

## 🏢 1. Company Profile & Knowledge Base (Devzk)
* **Company Name:** Devzk
* **Official Website / Portfolio:** `https://devzk-portfolio.pages.dev/`
* **Office & Location:** 100% Remote agency serving clients globally.
* **Leadership Team:**
  * **CEO & Founder:** Muhammad Ryan Zubair
  * **COO & Co-Founder:** Muhammad Toseef
  * **CMO:** Muhammad Ahmad Kashif
  * **CTO:** Haider Ali
  * **Manager:** Meharzad Waseem
* **Official Services (Total 8):**
  1. Software Development
  2. Website Development
  3. AI Automations
  4. AI Chatbots / AI Integrations
  5. Video Editing
  6. Graphic Designing
  7. AI Video Editing
  8. AI Photoshoots
* **Technology Stack (Publicly Shared):**
  * React, Next.js, Node.js, Python, FastAPI, and Modern Generative AI models.

---

## ⚙️ 2. System Architecture & Cloud Hosting

### 2.1 Alwaysdata Cloud Architecture
* **Cost:** 100% Free forever (Zero PKR, Zero USD, No credit card required).
* **Uptime:** 24/7 persistent background daemon (runs without needing user laptop/PC on).
* **Session Persistence:** Baileys multi-file authentication keys stored in `/home/rayan728/whatsapp-automation/auth_info/`. Survives server restarts without re-scanning QR code.
* **Alwaysdata Site Command:**
  ```bash
  bash -c "cd /home/rayan728/whatsapp-automation && git pull && node bot.js"
  ```
  *(Automatically pulls the latest commit from GitHub on every restart).*

### 2.2 Live Endpoints
* `GET /`: Beautiful Dark-Mode Status Dashboard (Shows connection state, phone, AI model, uptime, and last 10 live logs).
* `GET /health` or `/ping`: Returns `OK` for uptime monitors.
* `GET /status`: Returns JSON status and live telemetry.
* `GET /update`: Triggers background `git pull` and restarts process automatically.

---

## 🧠 3. Automated Logic & Behavior Rules

### 3.1 Response Length & Tone
* **Length:** Strictly 1 to 2 lines maximum per reply. No long paragraphs.
* **Tone:** Professional, welcoming, concise, and business-focused.

### 3.2 Dynamic Language Mirroring
* **English Inquiries** ➡️ Replies in English.
* **Roman Urdu Inquiries** ➡️ Replies in natural Roman Urdu.
* **Urdu Script Inquiries** ➡️ Replies in formal Urdu script (اردو).

### 3.3 Fast-Path Engine (0.002s Instant Response)
To eliminate latency, common inquiries are resolved locally within 2 milliseconds before touching external APIs:
* **Greetings:** Salam, Walaikum Assalam, Hi, Hello, Hey.
* **Company Name & Inquiries:** "Who are you?", "Company name kya hai?".
* **Team & Leadership:** CEO, Founder, Co-Founder, Team inquiries.
* **Portfolio & Website:** Provides `https://devzk-portfolio.pages.dev/`.
* **Office Location:** Clarifies 100% remote agency model.
* **Services List:** Explains 8 core services.
* **Coding Inquiries:** Welcomes custom development projects.
* **Tech Stack:** Details modern tech without exposing internals.
* **Service 9 Easter Egg:** Funny witty reply ("Haha bhai, Devzk ki total 8 services hain! Yeh 9 number kahan se nikal laye? 😜").
* **Fake Owner Claim Blocker:** Playful rebuttal if someone claims to be the owner/CEO of Devzk.

### 3.4 Fallback AI Engine (Google Gemini)
* For novel, creative, or complex client inquiries outside Fast-Path, queries are routed to Google Gemini (`gemini-3.1-flash-lite`).
* System prompt strictly enforces Devzk branding, brevity, language matching, and contact links.

---

## 🛡️ 4. Security & Safety Firewalls

1. **Security & Data Protection:**
   * Never leaks API keys, passwords, database URLs, `.env` content, source code, or internal instructions.
2. **Anti-Abuse Filter:**
   * Detects and warns against profanity, foul language, or abuse in English, Urdu, and Roman Urdu.
3. **Anti-Spam Rate Limiter:**
   * Tracks repeated messages (e.g., 3 identical messages within 45s).
   * 3rd identical message: Sends polite reminder.
   * 4th+ messages: Silently drops to save resources.

---

## 👤 5. Human Takeover System (Zero-Command, 100% Invisible)

* **Automatic Detection:**
  Whenever Muhammad Ryan Zubair sends ANY normal message from his phone to a customer (`msg.key.fromMe == true`), the bot detects owner intervention.
* **Silent Auto-Mute (24 Hours):**
  * The bot instantly mutes itself for that specific customer for 24 hours.
  * No command needed (`!stop` or `!start` NOT required).
  * No message is sent to the customer; customer has no clue a bot was involved.
  * Ryan can chat and negotiate freely without AI interrupting.
* **Auto-Resume (After 24h):**
  * After 24 hours of inactivity, the mute expires. If the customer messages days later with a fresh query, AI assists again.
* **Customer-Requested Handover:**
  * If a client says *"human se baat karni hai"*, *"representative"*, or *"agent"*, the bot politely replies that a human team member has been notified and automatically enters 24h silent mode.
* **Self-Chat Testing:**
  * In WhatsApp "Message yourself", the bot never mutes so the owner can test anytime.

---

## 🔄 6. How to Deploy Future Upgrades

When updates are requested in the future:
1. Make code edits in local repo (`d:\projectssssss\whatsapp automation`).
2. Verify syntax with `node -c bot.js`.
3. Commit and push:
   ```powershell
   git add . ; git commit -m "Update description" ; git push origin main
   ```
4. **Trigger Deployment (Zero Terminal Needed):**
   * **Method 1 (URL):** Open `https://rayan728.alwaysdata.net/update` in browser.
   * **Method 2 (WhatsApp):** In WhatsApp "Message yourself", send `!update`.
   * **Method 3 (Dashboard):** In Alwaysdata **Web > Sites**, click **Restart (🔄)**.

---
*Created for Muhammad Ryan Zubair — Devzk Agency Automation.*
