document.addEventListener('DOMContentLoaded', function() {
  const listEl = document.getElementById('challengesList');
  const csrftoken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';

  // User profile dropdown
  const userProfile = document.getElementById('userProfile');
  const profileMenu = document.getElementById('profileMenu');
  if (userProfile && profileMenu) {
      userProfile.addEventListener('click', function(e) {
          // Prevent toggle if clicking directly on the link (to avoid two-click issue)
          if (e.target.closest('a')) {
              return; // Let the link handle the click (redirect)
          }
          profileMenu.classList.toggle('active');
      });
      
      // Close dropdown when clicking elsewhere
      document.addEventListener('click', function(e) {
          if (!userProfile.contains(e.target)) {
              profileMenu.classList.remove('active');
          }
      });
  }

  // Populate points from dashboard status API and update the points box
  function fetchPoints() {
    fetch('/dashboard/api/status/', { credentials: 'same-origin' })
      .then(r => r.json())
      .then(js => {
        if (!js || !js.success) return;
        const pts = Number(js.points || 0);
        const pEl = document.getElementById('userPointsChallenges');
        if (pEl) pEl.textContent = pts;
      })
      .catch(err => {
        // silently ignore; optional to log
        // console.warn('Failed to load points', err);
      });
  }

  function fetchList() {
    fetch('/challenges/api/list/', {
      method: 'GET',
      credentials: 'same-origin'
    })
    .then(r => r.json())
    .then(json => {
      if (!json.success) return;
      renderList(json.challenges || []);
      // refresh points after list render to ensure UI shows authoritative value
      try { fetchPoints(); } catch (e) {}
    })
    .catch(e => console.warn('Failed to load challenges', e));
  }

  function renderList(items) {
    // we always display exactly 3 challenge slots (fill with placeholders if fewer)
    listEl.innerHTML = '';
    const slots = 3;
    for (let i = 0; i < slots; i++) {
      const item = items[i];
      const card = document.createElement('div');
      card.className = 'challenge-card';
      if (item) {
        card.innerHTML = `
          <div class="challenge-top">
            <label class="challenge-item">
              <input type="checkbox" data-id="${item.id}" ${item.completed ? 'checked' : ''}>
              <div class="challenge-meta">
                <div class="challenge-title">${escapeHtml(item.title)}</div>
                  <div class="challenge-desc">${escapeHtml(item.description || '')}</div>
              </div>
            </label>
          </div>
          <div class="challenge-footer">
            <div class="challenge-points">${item.points} pts</div>
            <div class="challenge-actions">
              <div class="${item.completed ? 'challenge-status' : 'challenge-status incomplete'}">${item.completed ? 'Completed' : 'Incomplete'}</div>
            </div>
          </div>
        `;
      } else {
        card.innerHTML = `
          <div class="challenge-top">
            <div class="challenge-meta">
              <div class="challenge-title">No Challenge</div>
              <div class="challenge-desc challenge-placeholder">This slot will be filled when new challenges are available.</div>
            </div>
          </div>
          <div class="challenge-footer">
            <div class="challenge-points">—</div>
            <div class="challenge-status">—</div>
          </div>
        `;
      }
      listEl.appendChild(card);
    }

    // attach handlers
    // Checkboxes are informational-only (auto-updated by activities). Make them unclickable.
    listEl.querySelectorAll('input[type="checkbox"]').forEach(cb => {
      cb.disabled = true;
      cb.title = 'This checkbox is controlled automatically and cannot be changed manually.';
    });
  }

  function escapeHtml(s) {
    return (s||'').replace(/[&<>"']/g, function(c){
      return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;"}[c];
    });
  }

  fetchList();
  // initial points fetch in case the challenges list fetch doesn't run or is slow
  try { fetchPoints(); } catch (e) {}
});

function getActivityIcon(item) {
  const key = (item.key || '').toLowerCase();
  const title = (item.title || '').toLowerCase();
  if (key.includes('eco') || title.includes('bike') || title.includes('walk')) return '<i class="fas fa-bicycle"></i>';
  if (key.includes('green') || title.includes('vegetarian') || title.includes('vegan')) return '<i class="fas fa-leaf"></i>';
  if (key.includes('recycle') || title.includes('recycle')) return '<i class="fas fa-recycle"></i>';
  if (key.includes('energy') || title.includes('renew')) return '<i class="fas fa-bolt"></i>';
  if (key.includes('carbon') || title.includes('neutral')) return '<i class="fas fa-globe"></i>';
  return '<i class="fas fa-trophy"></i>';
}


