// Small JS helpers for the History page
document.addEventListener('DOMContentLoaded', function () {
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
