export default function AdminDashboard() {
  const admin = document.createElement('div');
  admin.className = 'admin-dashboard removable';

  admin.innerHTML = `
    <div class="admin-functions-grid">
      <div class="admin-function-card notify-users">
        <h3>Notify Users</h3>
      </div>
      <div class="admin-function-card block-users">
        <h3>Block Users</h3>
      </div>
      <div class="admin-function-card unblock-users">
        <h3>Unblock Users</h3>
        </div>
      <div class="admin-function-card user-reports">
        <h3>User Reports</h3>
      </div>
      <div class="admin-function-card error-reports">
        <h3>Error Reports</h3>
      </div>
    </div>
    <div class="user-stats-dashboard">
      <div class="stats-card">
        <h3 class="active-users">Active Users</h3> 
      </div>

      <div class="stats-card">
        <h3 class="login-stats">Login Stats</h3> 
      </div>

      <div class="stats-card">
        <h3 class="misc-stats">Misc. Stats</h3> 
      </div>
    </div>
  `;

  return admin;
}
