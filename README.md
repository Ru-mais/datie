# MalluLove 🥥❤️

**The Premium Dating Platform for Kerala.**

MalluLove is a modern, high-performance dating application built specifically for the Malayali community. It combines a sleek, cinematic user experience with culturally relevant discovery features, making it easier than ever for Keralites to find meaningful connections.

![Project Status](https://img.shields.io/badge/Status-Development-gold)
![Tech Stack](https://img.shields.io/badge/Stack-MERN-green)

---

## ✨ Key Features

### 🎞️ Cinematic Experience
- **Premium UI/UX**: Built with Next.js 16 and TailwindCSS, featuring glassmorphism and smooth animations using `anime.js`.
- **Responsive Design**: Optimized for everything from iPhone screens in Kochi to desktops in Trivandrum.

### 🛡️ Secure Authentication
- **JWT-based Auth**: Secure session management using HTTP-only cookies.
- **Onboarding**: A dedicated registration flow capturing cultural details like Home District and Profession.

### 🔍 Cultural Discovery
- **District Filters**: Find matches in your specific Kerala district (Ernakulam, Kozhikode, Thrissur, etc.).
- **Smart Swiping**: A Tinder-style discovery engine that excludes already-swiped profiles and highlights premium users.
- **Mutual Matches**: Real-time detection of mutual interest with a dedicated **Matches Dashboard**.

---

## 🛠️ Tech Stack

- **Frontend**: Next.js 16 (App Router), React, Axios, Lucide Icons, Anime.js.
- **Backend**: Node.js, Express.js.
- **Database**: MongoDB (Atlas) with Mongoose ODM.
- **State Management**: React Context API for global Authentication and Match state.
- **Security**: Bcrypt.js for password hashing, Cookie-parser for secure JWT handling.

---

## 🚀 Getting Started

### 1. Clone the repository
```bash
git clone [your-repo-link]
cd datii
```

### 2. Setup Environment Variables
Create a `.env` file in the `server` directory:
```env
PORT=5000
DATABASE=your_mongodb_connection_string
DATABASE_PASSWORD=your_password
JWT_SECRET=your_secret_key
JWT_EXPIRES_IN=90d
JWT_COOKIE_EXPIRES_IN=90
NODE_ENV=development
```

### 3. Install Dependencies
```bash
# In the root directory
npm install

# In the server directory
cd server && npm install
```

### 4. Run the application
```bash
# Start Backend (Port 5000)
cd server && npm run dev

# Start Frontend (Port 3001)
cd .. && npm run dev
```

---

## 🗺️ Roadmap
- [ ] **Real-Time Chat**: Integration with Socket.io for instant messaging.
- [ ] **Image Uploads**: Cloudinary integration for user portraits.
- [ ] **Premium Membership**: Razorpay/Stripe integration for unlimited swipes.

---

## 📄 License
This project is for demonstration and portfolio purposes. All rights reserved.

Created with ❤️ for Kerala.
