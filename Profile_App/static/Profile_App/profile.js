document.addEventListener('DOMContentLoaded', function() {
    // Make profile menu links navigate to /profile/ across pages
    const userProfile = document.getElementById('userProfile');
    const profileMenu = document.getElementById('profileMenu');

    function closeProfileMenuIfOutside(e) {
        if (!userProfile) return;
        if (!userProfile.contains(e.target)) {
            profileMenu && profileMenu.classList.remove('active');
        }
    }

    if (userProfile && profileMenu) {
        // Make the avatar container act like a button for accessibility
        userProfile.setAttribute('role', 'button');
        userProfile.setAttribute('tabindex', '0');
        userProfile.setAttribute('aria-haspopup', 'true');
        userProfile.setAttribute('aria-expanded', 'false');

        // Toggle menu on avatar click
        function toggleProfileMenu() {
            var isActive = profileMenu.classList.toggle('active');
            userProfile.setAttribute('aria-expanded', isActive ? 'true' : 'false');
        }

        userProfile.addEventListener('click', function(e) {
            e.stopPropagation();
            toggleProfileMenu();
        });

        // Toggle with keyboard (Enter / Space)
        userProfile.addEventListener('keydown', function(e){
            if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') {
                e.preventDefault();
                toggleProfileMenu();
            }
        });
        // Close when clicking elsewhere
        document.addEventListener('click', closeProfileMenuIfOutside);

        // Ensure the profile menu item navigates to /profile/
        // Look for an element with class 'profile-menu-item' or a data-action attribute
        const profileItems = Array.from(profileMenu.querySelectorAll('.profile-menu-item'));
        profileItems.forEach(function(it){
            it.style.cursor = 'pointer';
            it.addEventListener('click', function(ev){
                // If the item contains an anchor, let it navigate naturally but close the menu.
                ev.stopPropagation();
                profileMenu.classList.remove('active');
                userProfile.setAttribute('aria-expanded', 'false');
                var anchor = it.querySelector && it.querySelector('a');
                if (anchor && anchor.getAttribute('href')) {
                    // navigate explicitly in case the user clicked the parent element
                    window.location.href = anchor.getAttribute('href');
                    return;
                }
                // fallback navigation
                window.location.href = '/profile/';
            });
        });

        // Also bind any anchors inside the profile menu that point to /profile/
        const anchors = Array.from(profileMenu.querySelectorAll('a'));
        anchors.forEach(function(a){
            try {
                const href = a.getAttribute('href') || '';
                if (href === '/profile/' || href.endsWith('/profile/')) {
                    a.addEventListener('click', function(ev){
                        // close menu so it isn't left open when navigating
                        profileMenu.classList.remove('active');
                        userProfile.setAttribute('aria-expanded', 'false');
                        // allow normal navigation
                    });
                }
            } catch (e) { /* ignore malformed hrefs */ }
        });
    } else if (profileMenu) {
        // If profile menu exists but avatar container isn't found, ensure clicking menu items still navigates
        const profileItems = Array.from(profileMenu.querySelectorAll('.profile-menu-item'));
        profileItems.forEach(function(it){
            it.style.cursor = 'pointer';
            it.addEventListener('click', function(ev){
                profileMenu.classList && profileMenu.classList.remove('active');
                window.location.href = '/profile/';
            });
        });
    }
});

// Avatar preview: when user selects a file, show it immediately in the avatar img element
document.addEventListener('DOMContentLoaded', function() {
    var fileInput = document.getElementById('id_avatar');
    if (!fileInput) return;
    fileInput.addEventListener('change', function(e) {
        var file = fileInput.files && fileInput.files[0];
        if (!file) return;
        if (!file.type.startsWith('image/')) return;
        var reader = new FileReader();
        reader.onload = function(evt) {
            var img = document.getElementById('profileAvatarImg');
            var initials = document.getElementById('profileAvatarInitials');
            if (img) {
                img.src = evt.target.result;
            } else if (initials) {
                // replace initials div with an img
                var newImg = document.createElement('img');
                newImg.id = 'profileAvatarImg';
                newImg.style.width = '96px';
                newImg.style.height = '96px';
                newImg.style.borderRadius = '50%';
                newImg.style.objectFit = 'cover';
                newImg.src = evt.target.result;
                initials.parentNode.replaceChild(newImg, initials);
            }
        };
        reader.readAsDataURL(file);
    });
});

// Wire custom choose button to hidden file input (no filename shown)
document.addEventListener('DOMContentLoaded', function() {
    var chooseBtn = document.getElementById('avatarChooseBtn');
    var fileInput = document.getElementById('id_avatar');
    if (!chooseBtn || !fileInput) return;
    chooseBtn.addEventListener('click', function(e){
        e.preventDefault();
        fileInput.click();
    });
});