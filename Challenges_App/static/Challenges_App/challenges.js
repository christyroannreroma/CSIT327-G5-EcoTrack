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
    listEl.innerHTML = '';
    items.forEach(item => {
      const row = document.createElement('div');
      row.className = 'challenge-row';
      row.innerHTML = `
        <label class="challenge-item">
          <input type="checkbox" data-id="${item.id}" ${item.completed ? 'checked' : ''}>
          <div class="challenge-meta">
            <div class="challenge-title">${escapeHtml(item.title)}</div>
            <div class="challenge-desc">${escapeHtml(item.description || '')}</div>
          </div>
          <div class="challenge-points">${item.points} pts</div>
        </label>
      `;
      listEl.appendChild(row);
    });

    // attach handlers
    listEl.querySelectorAll('input[type="checkbox"]').forEach(cb => {
      cb.addEventListener('change', function() {
        const id = this.getAttribute('data-id');
        const completed = this.checked;
        fetch('/challenges/api/toggle/', {
          method: 'POST',
          credentials: 'same-origin',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrftoken
          },
          body: JSON.stringify({ challenge_id: id, completed })
        })
        .then(r => r.json())
        .then(json => {
          if (!json.success) {
            console.warn('Failed to toggle');
          }
        })
        .catch(e => console.warn('Toggle error', e));
      });
    });
  }

  function escapeHtml(s) {
    return (s||'').replace(/[&<>"']/g, function(c){
      return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;"}[c];
    });
  }

  fetchList();
});
