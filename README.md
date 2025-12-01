# 🌍 EcoTrack

A web platform designed to promote sustainable habits by tracking user
activity, visualizing progress, and strengthening environmental
awareness.

🔗 **Live Deployment:**\
👉 https://csit327-g5-ecotrack.onrender.com/

------------------------------------------------------------------------

## 📌 Overview

EcoTrack is a sustainability-focused web application developed in partial fulfillment of the requirements for the courses of
**CSIT327 (Information Management 2) and IT317 (Project Management for IT)**. It allows users to:

-   Register and log in securely
-   Track eco-friendly tasks and activities
-   View sustainability insights through dashboards
-   Manage their environmental progress

------------------------------------------------------------------------

## 🛠️ Tech Stack

### **Frontend:**

  **HTML5** - Page structure and content

  **CSS3** - Visual design and responsiveness

  **JavaScript** - Interactivity without external frameworks
                                   
  -----------------------------------------------------------------------

### **Backend:**

  **Django (Python)** - Backend framework for handling logic, routing, authentication, and templating

  -----------------------------------------------------------------------

### **Database:**

  **Supabase (PostgreSQL)** - Cloud-managed PostgreSQL database for persistent data

  -----------------------------------------------------------------------

### **Deployment:**

  **Render** - Used for hosting the Django application with Gunicorn

------------------------------------------------------------------------

## 📂 Project Structure

(Current as of latest commit)

    CSIT327-G5-EcoTrack/
    │
    ├── manage.py
    ├── requirements.txt
    ├── build.sh
    │
    ├── EcoTrack/                # Django project configuration
    │   ├── __init__.py
    │   ├── asgi.py
    │   ├── settings.py
    │   ├── urls.py
    │   └── wsgi.py
    │
    ├── Activity_App/
    ├── Challenges_App/
    ├── Dashboard_App/
    ├── History_App/
    ├── Homepage_App/
    ├── Login_App/
    ├── Profile_App/
    ├── Signup_App/
    └── static/...

------------------------------------------------------------------------

## ⚙️ Installation & Setup

### **1. Clone the Repository**

``` bash
git clone https://github.com/sanggreterra/CSIT327-G5-EcoTrack.git
```
``` bash
cd CSIT327-G5-EcoTrack
```

### **2. (Optional) Create a Virtual Environment**

``` bash
python -m venv venv
```

``` bash
venv\Scripts\activate         # Windows
```

``` bash
source venv/bin/activate      # macOS/Linux
```

### **3. Install Dependencies**

``` bash
pip install -r requirements.txt
```

``` bash
python manage.py makemigrations
```

``` bash
python manage.py migrate
```

### **4. Run the Development Server**

``` bash
python manage.py runserver
```

🌐 Your app will be available at:
http://127.0.0.1:8000/

------------------------------------------------------------------------

# 📡 API Endpoints

Although EcoTrack primarily uses Django templates, below are the **main
routes/endpoints** exposed by the application.

### **Authentication:**

  - GET      `/login/`    Render login page
  - POST     `/login/`    Authenticate user
  - GET      `/signup/`   Render registration page
  - POST     `/signup/`   Create new user account
  - GET      `/logout/`   Log out user and redirect

### **Homepage:**

  - GET      `/`        Homepage view

### **Dashboard**

  - GET      `/dashboard/`   Displays user progress and visual analytics

### **Activity Tracking**

  - GET      `/activity/`               View activities
  - POST     `/activity/add/`           Add a new eco activity
  - POST     `/activity/delete/<id>/`   Delete a logged activity

------------------------------------------------------------------------

# 🛠️ Troubleshooting

### **⚠️ 1. Static files not loading**

Make sure: - `collectstatic` is run
- WhiteNoise is enabled
- `STATIC_ROOT` is correctly set

### **⚠️ 2. "ModuleNotFoundError" on Deploy**

Common causes: - Incorrect folder structure
- Wrong app imports
- Incorrect WSGI path

Start command should be:

    gunicorn EcoTrack.wsgi:application

### **⚠️ 3. "CSRF Verification Failed"**

Check environment variables:

    DJANGO_CSRF_TRUSTED_ORIGINS=https://your-app.onrender.com
    DJANGO_ALLOWED_HOSTS=your-app.onrender.com

### **⚠️ 4. Database Connection Issues**

-   Verify `DATABASE_URL`
-   Must include `?sslmode=require`
-   Ensure Supabase instance is active

### **⚠️ 5. Local server won't start**

``` bash
pip install -r requirements.txt --upgrade
```

``` bash
python manage.py migrate
```

------------------------------------------------------------------------

# 🤝 How to Contribute

### **1. Clone this repository**

``` bash
git clone https://github.com/christyroannreroma/CSIT327-G5-EcoTrack.git
```

### **2. Create a Branch**

``` bash
git checkout -b feature/my-feature
```

### **3. Commit Changes**

### **4. Push & Submit PR**

------------------------------------------------------------------------
# 👥 Team
Project Management Team:
- **Product Owner:** Christy Roan Reroma/christyroan.reroma@cit.edu
- **Business Analyst:** Zilfa Edz Quirante/zilfaedz.quirante@cit.edu
- **Scrum Master:** Karl Miguel Penida/karlmiguel.penida@cit.edu

Development Team:
- **Lead Developer:** Sang'gre Terra/joji.matsuda@cit.edu
- **Backend Developer:** Dharell Dave H. Melliza/dharelldave.melliza@cit.edu
- **Frontend Developer/Designer:** Sittie Sharimah M. Macasindel/sittiesharima.macasindel@cit.edu
------------------------------------------------------------------------

# 💬 Acknowledgements & Thank You

We thank:

-   **CIT University College of Computer Studies (https://www.facebook.com/cit.university.ccs)**
-   **Filipino Web Development Peers Discord Server (https://discord.gg/FkjV7gk3)**

Your interest helps make this project better! 🌿💚
