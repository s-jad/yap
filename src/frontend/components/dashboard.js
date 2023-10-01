import tribe from '../assets/imgs/tribe.svg';
import joinTribe from '../assets/imgs/join_tribe.svg';
import gathering from '../assets/imgs/gathering.svg';
import planGathering from '../assets/imgs/plan_gathering.svg';
import formTribe from '../assets/imgs/form_tribe.svg';
import reportIssue from '../assets/imgs/report_issue.svg';

function getDashboardIcons() {
  const gatheringIcon = new Image();
  const formTribeIcon = new Image();
  const joinTribeIcon = new Image();
  const planGatheringIcon = new Image();
  const tribeIcon = new Image();
  const reportIssueIcon = new Image();

  gatheringIcon.src = gathering;
  formTribeIcon.src = formTribe;
  joinTribeIcon.src = joinTribe;
  planGatheringIcon.src = planGathering;
  tribeIcon.src = tribe;
  reportIssueIcon.src = reportIssue;

  gatheringIcon.alt = 'A gathering of people';
  formTribeIcon.alt = 'A person calling people to join them';
  joinTribeIcon.alt = 'A person joining a group of people';
  planGatheringIcon.alt = 'A person thinking of a group of people';
  tribeIcon.alt = 'A group of people';
  reportIssueIcon.alt = 'A person with an exclamation mark';

  return [
    gatheringIcon,
    formTribeIcon,
    joinTribeIcon,
    planGatheringIcon,
    tribeIcon,
    reportIssueIcon,
  ];
}

async function fetchReportIssue() {
  try {
    const response = await fetch('http://localhost:3000/report-user-issue', { mode: 'cors' });
    console.log("response =>", response);
    const reportUserIssueContainer = await response.text()     
    const app = document.getElementById('app');
    const homePage = document.getElementById('home-page-container');

    app.removeChild(homePage);
    app.innerHTML = reportUserIssueContainer;
  } catch (error) {
    console.log("fetchReportIssue ERROR", error);
  }
}

export default function Dashboard() {
  const dashboardContainer = document.createElement('div');
  dashboardContainer.className = 'dashboard-container';
  const dashboardGrid = document.createElement('div');
  dashboardGrid.className = 'dashboard-grid';

  dashboardGrid.innerHTML = `
    <a class="card-link connect-members-link" href="#" tabindex="2">
      <div class="dashboard-card">
        <p class="card-text">Connect with members</p>
      </div>    
    </a>
    <a class="card-link form-tribe-link" href="#" tabindex="3">
      <div class="dashboard-card">
        <p class="card-text">Form your own tribe</p>
      </div>    
    </a>
    <a class="card-link join-tribe-link" href="#" tabindex="4">
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
    <a class="card-link report-link" href="#" tabindex="7">
      <div class="dashboard-card">
        <p class="card-text">Report an issue</p>
      </div>    
    </a>
  `;

  const links = Array.from(dashboardGrid.querySelectorAll('.card-link'));

  links[5].addEventListener('click', fetchReportIssue);

  const cards = Array.from(dashboardGrid.querySelectorAll('.dashboard-card'));
  const texts = Array.from(dashboardGrid.querySelectorAll('.card-text'));
  const images = getDashboardIcons();

  for (let i = 0; i < cards.length; i += 1) {
    images[i].className = 'card-icon';
    cards[i].insertBefore(images[i], texts[i]);
  }

  dashboardGrid.addEventListener('pointermove', (ev) => {
    dashboardGrid.style.setProperty('--x', `${ev.x}px`);
    dashboardGrid.style.setProperty('--y', `${ev.y}px`);
  });

  dashboardContainer.appendChild(dashboardGrid);

  return dashboardContainer;
}
