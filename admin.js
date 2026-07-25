document.addEventListener('DOMContentLoaded', () => {
  const root = document.getElementById('admin-root');
  if (!root) return;

  const bookings = JSON.parse(localStorage.getItem('selfcare_bookings') || '[]');

  root.innerHTML = `
    <div class="admin-stats-grid">
      <div class="glass-card">
        <h4>Total Orders</h4>
        <p style="font-size:24px; font-weight:700;">${bookings.length}</p>
      </div>
      <div class="glass-card">
        <h4>System Status</h4>
        <p style="color:green; font-weight:600;">Google Apps Script Connected</p>
      </div>
    </div>
  `;
});
