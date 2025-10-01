# Contributing to EcoTrack

<!-- Intro section -->
Thank you for your interest in contributing! Please follow these guidelines.

---
# =========================
# 1. Getting Started
# =========================
1. Fork the repository.
2. Clone your fork locally:

 Replace YOUR_USERNAME with your GitHub username

git clone https://github.com/YOUR_USERNAME/EcoTrack.git
cd EcoTrack
# =========================
# 2. Install dependencies:
# =========================
## Frontend

cd frontend
npm install

## Backend

cd ../backend
npm install


Copy .env.example to .env and configure your environment variables.
# =========================
# 3. Branching & Workflow
# =========================
<!-- Use feature branches -->

##Always create a new branch for your feature or bug fix:

git checkout -b feature/your-feature-name


## Commit changes with clear messages:

git add .
git commit -m "Add login page"


##Push your branch:

git push origin feature/your-feature-name

Open a Pull Request (PR) to main on the official repo.
# =========================
# 4. Code Guidelines
# =========================
Follow ESLint and Prettier formatting rules.

Keep commits small and focused.

Comment your code for clarity.

Frontend: Use React functional components with hooks.

Backend: Use Express.js middleware for authentication, logging, and error handling.
# =========================
# 5. Reporting Issues
# =========================
Use GitHub Issues to report bugs or request features.

Provide clear reproduction steps and screenshots if needed.
# =========================
# 6. Code of Conduct
# =========================
Be respectful and collaborative.

Avoid offensive language or behavior.

Respect contributors’ time and effort.
