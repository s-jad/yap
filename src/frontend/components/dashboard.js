import { importedComponents, handleClientSideLinks } from './fetch_apis';
import { getDashboardIcons } from './icons';

export default function Dashboard() {
  const dashboardContainer = document.createElement('div');
  dashboardContainer.id = 'dashboard-container';
  dashboardContainer.className = 'removable';

  const dashboardGrid = document.createElement('div');
  dashboardGrid.className = 'dashboard-grid';

  dashboardGrid.innerHTML = `
    <a class="card-link connect-members-link" href="#" tabindex="2">
      <div class="dashboard-card">
        <p class="card-text">Connect with members</p>
      </div>    
    </a>
    <a class="card-link form-tribe-link" href="/api/create-a-tribe" data-link="/create-a-tribe" tabindex="3">
      <div class="dashboard-card">
        <p class="card-text">Form your own tribe</p>
      </div>    
    </a>
    <a class="card-link join-tribe-link" href="/api/join-a-tribe" data-link="/join-a-tribe" tabindex="4">
      <div class="dashboard-card">
        <p class="card-text">Join an existing tribe</p>
      </div>    
    </a>
    <a class="card-link plan-gathering-link" href="#" tabindex="5">
      <div class="dashboard-card">
        <p class="card-text">Plan a gathering</p>
      </div>    
    </a>
    <a class="card-link join-gathering-link" href="#" tabindex="6">
      <div class="dashboard-card">
        <p class="card-text">Join a gathering</p>
      </div>    
    </a>
    <a class="card-link report-link" href="/report-user-issue" data-link="/report-user-issue" tabindex="7">
      <div class="dashboard-card">
        <p class="card-text">Report an issue</p>
      </div>    
    </a>
  `;

  getDashboardIcons(dashboardGrid);

  const links = Array.from(dashboardGrid.querySelectorAll('[data-link]'));

  links.forEach((link) => {
    link.addEventListener('click', (ev) => {
      ev.preventDefault();
      const url = link.getAttribute('data-link');
      history.pushState(null, null, url);
      handleClientSideLinks(url);
    });
  });

  dashboardGrid.addEventListener('pointermove', (ev) => {
    dashboardGrid.style.setProperty('--x', `${ev.x}px`);
    dashboardGrid.style.setProperty('--y', `${ev.y}px`);
  });

  dashboardContainer.appendChild(dashboardGrid);

  return dashboardContainer;
}

function sendDashboardToImported() {
  importedComponents.dashboard = Dashboard;
}

sendDashboardToImported();
