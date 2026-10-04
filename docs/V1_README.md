# ⚡ Triage AI

> **Crack your exam question instantly.**  
> Upload a question image → get core concepts, the hidden trap, and a step-by-step attack plan — powered by Google Gemini 3.8 Flash.

🌐 **Live demo:** [gemmate.vercel.app](https://gemmate.vercel.app)

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Project Structure](#project-structure)
- [Tech Stack](#tech-stack)
- [Getting Started — Web App](#getting-started--web-app)
- [Getting Started — Flutter Android App](#getting-started--flutter-android-app)
- [API Reference](#api-reference)
- [Deployment](#deployment)
- [Environment Variables](#environment-variables)

---

## Overview

Triage AI is a full-stack AI tool for students preparing for technical exams. It takes one or more photos of an exam question and returns a structured breakdown:

| Card | What it tells you |
|---|---|
| **Core Concepts** | The fundamental topics you need to know |
| **The Trap(s)** | The trick or subtle pitfall hidden in the question |
| **Attack Plan** | A step-by-step strategy for solving the question |

Beyond triage, it generates practice questions based on the same concepts and traps, provides Socratic hints (nudges, not answers), and can export questions as PDFs.

---

## Features

- 📸 **Multi-image upload** — Up to 3 images (gallery or camera)
- 🧠 **AI Triage** — Core concepts, trap detection, attack plan
- 🎯 **Multiple traps** — Identifies all traps when more than one exists
- ✏️ **Practice questions** — Generate multiple questions sequentially  
- 💡 **Progressive hints** — Up to 3 Socratic hints per question (never gives answers)
- ↺ **Regenerate** — Re-generate any individual question
- ⬇ **PDF export** — Save practice questions as formatted PDFs
- 🛑 **Cancel in-flight** — Interrupt a triage or generation at any time
- 📱 **Cross-platform** — Next.js web app + Flutter (Web & Android)

---

## Project Structure

```
Gemmate/
├── src/                          # Next.js web application
│   └── app/
│       ├── api/
│       │   ├── triage/route.ts   # POST /api/triage
│       │   ├── practice/route.ts # POST /api/practice
│       │   └── hint/route.ts     # POST /api/hint
│       ├── components/
│       │   ├── ImageUpload.tsx
│       │   ├── ResultCards.tsx
│       │   ├── PracticeCard.tsx
│       │   └── SkeletonLoader.tsx
│       ├── utils/
│       │   └── exportPdf.ts      # Browser-print PDF export
│       ├── globals.css
│       ├── layout.tsx
│       └── page.tsx
│
├── mobile/                       # Flutter Android application
│   └── lib/
│       ├── config.dart           # ← Edit backend URL here
│       ├── main.dart
│       ├── models/
│       │   └── triage_result.dart
│       ├── services/
│       │   └── api_service.dart
│       ├── screens/
│       │   ├── home_screen.dart
│       │   └── result_screen.dart
│       └── widgets/
│           ├── image_upload_widget.dart
│           ├── triage_card.dart
│           └── practice_question_card.dart
│
├── .env.local                    # Secret keys (never commit)
└── package.json
```

---

## Tech Stack

### Web App
| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| UI | React 19 + Framer Motion |
| Styling | Tailwind CSS v4 + custom CSS variables |
| Icons | Lucide React |
| Markdown | react-markdown + remark-math + rehype-katex |
| AI | Google Gemini 3.8 Flash (`@google/generative-ai`) |

### Flutter App
| Layer | Technology |
|---|---|
| Framework | Flutter 3 (Material 3) |
| Language | Dart |
| HTTP | `http` package |
| Image Picker | `image_picker` |
| Markdown | `flutter_markdown` |
| Math / LaTeX | `flutter_math_fork` |
| PDF Export | `pdf` + `printing` |
| Fonts | `google_fonts` (Inter) |

---

## Getting Started — Web App

### Prerequisites
- Node.js 18+
- A Google Gemini API key → [Get one here](https://aistudio.google.com/app/apikey)

### 1. Install dependencies
```bash
npm install
```

### 2. Set your API key
Create `.env.local` in the project root:
```env
GEMINI_API_KEY=your_actual_key_here
```

### 3. Run in development
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000).

### 4. Build for production
```bash
npm run build
npm start
```

---

## Getting Started — Flutter Android App

### Prerequisites
- Flutter 3.x (`flutter --version`)
- Android Studio or VS Code with Flutter extension
- An Android device or emulator (API 21+)

### 1. Point to your backend

Edit `mobile/lib/config.dart`:

```dart
import 'package:flutter/foundation.dart' show kIsWeb;

// Auto-selects the correct URL based on platform:
final String kBaseUrl = kIsWeb
    ? 'http://localhost:3000'       // Flutter Web dev
    : 'http://10.0.2.2:3000';      // Android emulator

// Physical Android device — change to your LAN IP:
// 'http://192.168.1.xx:3000'

// Production — change to your deployed Vercel URL:
// 'https://gemmate.vercel.app'
```

> **Note:** The Next.js web server must be running for the Flutter app to work. The Flutter app calls the same API routes — it does **not** embed the Gemini API key.

### 2. Install dependencies
```bash
cd mobile
flutter pub get
```

### 3. Run on Android
```bash
flutter run
```

Or open `mobile/` in Android Studio and press **Run**.

---

## API Reference

All routes are Next.js App Router handlers in `src/app/api/`.

### `POST /api/triage`

Analyzes exam question images and returns a structured breakdown.

**Request body:**
```json
{
  "images": ["data:image/jpeg;base64,...", "..."]
}
```

**Response:**
```json
{
  "core_concepts": ["Concept A", "Concept B"],
  "the_trap": ["The first trick", "The second trick"],
  "attack_plan": ["Step 1", "Step 2", "Step 3"]
}
```

---

### `POST /api/practice`

Generates a new exam-style practice question based on the triage output.

**Request body:**
```json
{
  "core_concepts": ["Concept A", "Concept B"],
  "the_trap": ["The trick"]
}
```

**Response:**
```json
{
  "markdown": "## Question\n\nGiven that..."
}
```

---

### `POST /api/hint`

Returns one Socratic hint for a practice question. Hints are progressively more specific; previous hints are passed in to avoid repetition. **Never reveals the answer.**

**Request body:**
```json
{
  "question": "## Question\n\nGiven that...",
  "existing_hints": ["First hint already shown"]
}
```

**Response:**
```json
{
  "hint": "Think about what happens when the boundary condition changes..."
}
```

---

## Deployment

### Next.js Web App

| Platform | Free tier | Notes |
|---|---|---|
| **Vercel** ✅ (recommended) | ✅ Yes | Zero-config Next.js support. Add `GEMINI_API_KEY` in project settings → Environment Variables. |
| **Railway** | ✅ Limited | No function timeout limits. Good fallback. |
| **Firebase App Hosting** | ❌ No | Requires Blaze (pay-as-you-go) plan. |

### Flutter Web App

Build and deploy to Firebase Hosting (free tier):
```bash
cd mobile
flutter build web --release
firebase deploy --only hosting
```

> Update `kBaseUrl` in `config.dart` to your deployed Vercel URL before building.

### Flutter Android App

Build a release APK and distribute via Firebase App Distribution (free):
```bash
cd mobile
flutter build apk --release
# APK: mobile/build/app/outputs/flutter-apk/app-release.apk
```

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `GEMINI_API_KEY` | ✅ | Google Gemini API key. Get one at [aistudio.google.com](https://aistudio.google.com/app/apikey). Never expose this on the client side. |
| `GEMINI_MODEL` | ❌ | Gemini model to use (default: `gemini-3.8-flash` with auto-fallback to `gemini-3.6-flash`). |

> The key is only used server-side in the Next.js API routes. It is never sent to the browser or the Flutter app.
