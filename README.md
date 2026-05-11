# Datie. 💎

**Datie.** is a premium, high-security dating platform designed for meaningful connections. Built with a "Security-First" philosophy, it combines a minimalist, high-fidelity aesthetic with advanced AI moderation and real-world identity verification.

---

## 🛡️ Security Architecture

### 📱 Real-World Identity Verification
Unlike traditional platforms that rely on easily faked emails, **Datie.** uses a **Phone-First Gateway**.
- **SMS OTP Integration**: Integrated with Firebase Phone Auth and invisible reCAPTCHA.
- **Verified Signup**: Users must verify their physical SIM card ownership before an account is ever created.
- **Unified Identity**: Seamlessly links verified phone numbers with secure email/password credentials for a single, robust user record.

### 🔞 AI Safety Lens (Content Moderation)
Every profile photo is a part of our safety perimeter.
- **Google Cloud Vision AI**: Real-time analysis of every uploaded image.
- **Automated Filtering**: Instantly blocks inappropriate content, violence, or spoofed faces using server-side 'Safe Search' detection.

### 🤐 Chat Smart Shield
The conversation space is protected by an active monitoring layer.
- **Profanity Filtering**: Real-time regex-based sanitization of messages.
- **Malicious Link Detection**: Scans for external URLs to prevent scams and phishing, warning users in real-time.

---

## ✨ Premium Features

- **Minimalist UX**: A high-end, monochrome design language inspired by luxury fashion interfaces.
- **Discovery Engine**: Optimized Firestore queries that filter out blocked, liked, and incomplete profiles to keep the feed fresh.
- **Star Gazers**: A dedicated space to see who liked you, enabling instant mutual matching and chat creation.
- **Matched Profile Inspector**: Detailed profile views for matches, allowing users to safely learn more about their connections.
- **Total User Control**: Full support for message editing, deletion, chat blocking, and profile management.

---

## 🚀 Technical Stack

- **Frontend**: Next.js 15 (App Router), React, TailwindCSS.
- **Backend**: Firebase (Auth, Firestore), Next.js API Routes.
- **AI**: Google Cloud Vision AI (Image Moderation).
- **Animations**: Anime.js for smooth, high-fidelity transitions.
- **State Management**: React Context & Hooks.

---

## 🛠️ Setup & Installation

### 1. Environment Configuration
Create a `.env` file in the root directory:
```bash
NEXT_PUBLIC_FIREBASE_API_KEY=your_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_id
GOOGLE_VISION_API_KEY=your_google_ai_key
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Run Development Server
```bash
npm run dev
```

---

## 📜 Development Philosophy
**Datie.** was built to prove that dating apps can be both beautiful and bulletproof. By moving verification to the signup gate and using AI for moderation, we ensure that every connection is real, safe, and meaningful.

---

**Built with ❤️ for the community.**
