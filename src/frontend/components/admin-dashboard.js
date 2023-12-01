import '../styles/admin-dashboard.css';
import { getMonthlyLoginStats, getUserActivityStats } from './tribes-db-access';

export default async function AdminDashboard() {
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
    </div>
    <div class="user-stats-dashboard">
      <div class="stats-headers-wrapper">
        <h3 class="user-activity-header">Active Users</h3> 
        <h3 class="login-stats-header">Login Stats</h3> 
        <h3 class="misc-stats-header">Misc. Stats</h3> 
      </div>
      
      <div class="stats-cards-wrapper">
        <div class="stats-card user-activity">
          <div class="stats-container user-activity"></div>
        </div>

        <div class="stats-card login-stats hidden">
          <div class="stats-container login-stats"></div>
        </div>

        <div class="stats-card misc-stats hidden">
          <div class="stats-container misc-stats"></div>
        </div>
      </div>
    </div>
  `;

  const headers = Array.from(admin.querySelectorAll('[class$="header"]'));
  const containers = Array.from(admin.querySelectorAll('.stats-container'));
  const cards = Array.from(admin.querySelectorAll('.stats-card'));

  const userActivityStats = await getUserActivityStats();
  const monthlyLoginStats = await getMonthlyLoginStats();
  //  const miscStats = await getMiscStats();

  headers.forEach((header, index) => {
    header.addEventListener(('click'), () => {
      const currentlyDisplayed = admin.querySelector('.stats-card:not(.hidden)');
      console.log("currentlyDisplayed => ", currentlyDisplayed);
      cards[index].classList.remove('hidden');
      currentlyDisplayed.classList.add('hidden');
    });
  });

  return admin;
}
