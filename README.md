# EcoTrack – Sustainability & Carbon Footprint Tracking Platform

**Proponents / Team Roles:**  
- Christy Roan Reroma – Product Owner / Project Manager  
- Zilfa Edz Quirante – Business Analyst  
- Karl Miguel Penida – Scrum Master  
- Development Team – Software engineers, AI engineers, UI/UX designers  

**Date:** August 13, 2025  

---

## 1. Project Overview

EcoTrack is a web-based sustainability platform designed to help users track their carbon footprint, manage recycling, and engage in eco-friendly challenges. The platform provides actionable insights, personalized eco-advice, and gamified features to encourage sustainable lifestyle changes.

Core Features for Implementation:
- Carbon footprint calculator (transport, diet, energy use)  
- Real-time activity logging and instant carbon feedback  
- Gamification (points, badges, leaderboards, challenges)  
- AI-powered eco-advice chatbot  
- Recycling guidance and community engagement tools  

---

## 2. Tech Stack

- Frontend: Next.js, Tailwind CSS, Framer Motion  
- Backend: Node.js, Express.js  
- Database: TiDB (or MySQL/PostgreSQL for local dev)  
- Authentication: Clerk  
- Other Tools: ImageKit (image handling), SurveyJS (interactive forms)  

---

# 🪟 EcoTrack Setup & Contribution Guide (Windows)

This guide will help you:

- Install Node.js & Git  
- Clone the EcoTrack repo  
- Open the project in VS Code  
- Run frontend and backend locally  
- Set up the database  
- Keep your repo updated  
- Create a branch & contribute on GitHub  

---

## 3. Install Node.js 🟢

1. Download Node.js from https://nodejs.org/en/download/  
2. Run the installer and keep defaults.  
3. Verify installation:

node -v
npm -v

Expected output:
Node v18.x.x
npm 9.x.x
yaml
Copy code

---

## 4. Install Git 🔧

1. Download Git from https://git-scm.com/download/win  
2. Keep defaults during installation  
3. Ensure "Git from the command line and also from 3rd-party software" is selected  
4. Verify installation:

git --version

Expected output:
git version 2.x.x.windows.1
yaml
Copy code

---

## 5. Clone the Repository 📂

git clone https://github.com/christyroannreroma/EcoTrack.git
cd EcoTrack

yaml
Copy code

---

## 6. Open in VS Code 🖥️

code .

yaml
Copy code

---

## 7. Install Recommended VS Code Extensions 🔌

Recommended extensions:
- ESLint
- Prettier
- GitLens
- Tailwind CSS IntelliSense
- Node.js Extension Pack
yaml
Copy code

---

## 8. Frontend Setup 💻

cd frontend
npm install # Install dependencies
npm run dev # Start frontend dev server (localhost:3000)

Open your browser: http://localhost:3000
yaml
Copy code

---

## 9. Backend Setup 💻

cd backend
npm install # Install dependencies

bash
Copy code

Create `.env` file in backend/:

DB_HOST=localhost
DB_USER=root
DB_PASSWORD=123456
DB_NAME=ecotrack
PORT=5000
JWT_SECRET=your_secret_key

sql
Copy code

Start backend server:

npm run dev

API should now be running on http://localhost:5000
yaml
Copy code

---

## 10. Database Setup 🗄️

Use TiDB or MySQL/PostgreSQL for local development
Run migrations or seed scripts if available
yaml
Copy code

---

## 11. Keep Your Local Repo Updated 🔄

git pull origin main

Update dependencies
cd frontend
npm install
cd ../backend
npm install

Run any pending database migrations
yaml
Copy code

---

## 12. Create a New Branch 🌱

git checkout -b your-feature-name

Example:
git checkout -b add-login-page

yaml
Copy code

---

## 13. Save & Commit Changes ✅

git add .
git commit -m "Added login page feature"

yaml
Copy code

---

## 14. Push Your Branch to GitHub ☁️

git push origin your-feature-name

yaml
Copy code

---

## 15. Open a Pull Request (PR) 🔄

1. Go to https://github.com/christyroannreroma/EcoTrack
2. Click "Compare & Pull Request"
3. Describe your changes → Create Pull Request
yaml
Copy code

---

## 16. Quick Recap (Windows)

1. Install Node.js → node -v
2. Install Git → git --version
3. Clone repo → git clone ...
4. Open project in VS Code → code .
5. Install recommended extensions
6. Frontend → cd frontend → npm install → npm run dev
7. Backend → cd backend → npm install → .env setup → npm run dev
8. Database → migrate/init tables
9. Update repo → git pull, npm install
10. Branch → git checkout -b feature-name
11. Commit → git add . → git commit -m "msg"
12. Push → git push origin feature-name → PR

Commit → git add . → git commit -m "msg"

Push → git push origin feature-name → PR
