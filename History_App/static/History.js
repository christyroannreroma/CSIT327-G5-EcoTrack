// Small JS helpers for the History page
document.addEventListener('DOMContentLoaded', function () {

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
  
  const exportBtn = document.getElementById('export-history-btn');
  if (exportBtn) {
    exportBtn.addEventListener('click', function () {
      // For now, simple client-side CSV export placeholder
      const rows = Array.from(document.querySelectorAll('.history-table tbody tr'));
      if (!rows.length) {
        alert('No history to export.');
        return;
      }
      const csv = rows.map(r => Array.from(r.querySelectorAll('td')).map(td => '"' + td.innerText.replace(/"/g, '""') + '"').join(',')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'history.csv';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    });
  }
});
