document.addEventListener('DOMContentLoaded', function() {
  const listEl = document.getElementById('challengesList');
  const csrftoken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';

  function fetchList() {
    fetch('/challenges/api/list/', {
      method: 'GET',
      credentials: 'same-origin'
    })
    .then(r => r.json())
    .then(json => {
      if (!json.success) return;
      renderList(json.challenges || []);
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
                <div class="challenge-note">Checkbox is informational — auto-completed via activity.</div>
              </div>
            </label>
          </div>
          <div class="challenge-footer">
            <div class="challenge-points">${item.points} pts</div>
            <div class="challenge-status">${item.completed ? 'Completed' : 'Incomplete'}</div>
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
});
