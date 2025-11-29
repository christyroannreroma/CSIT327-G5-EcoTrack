document.addEventListener('DOMContentLoaded', function() {
    // User profile dropdown (from dashboard.js)
    const userProfile = document.getElementById('userProfile');
    const profileMenu = document.getElementById('profileMenu');

    if (userProfile && profileMenu) {
        userProfile.addEventListener('click', function() {
            profileMenu.classList.toggle('active');
        });
        
        document.addEventListener('click', function(e) {
            if (!userProfile.contains(e.target)) {
                profileMenu.classList.remove('active');
            }
        });
    }

    // Client-side validation (similar to signup.js)
    const emailRegex = /^[^\s@]+