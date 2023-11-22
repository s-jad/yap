import tribe from '../assets/imgs/tribe.svg';
import joinTribe from '../assets/imgs/join_tribe.svg';
import gathering from '../assets/imgs/gathering.svg';
import planGathering from '../assets/imgs/plan_gathering.svg';
import formTribe from '../assets/imgs/form_tribe.svg';
import reportIssue from '../assets/imgs/report_issue.svg';
import logoSVG from '../assets/imgs/logo.svg';
import homeSVG from '../assets/imgs/home.svg';
import messagesSVG from '../assets/imgs/envelope.svg';
import membersSVG from '../assets/imgs/members.svg';
import friendsSVG from '../assets/imgs/friends.svg';
import applicationsSVG from '../assets/imgs/applications.svg';
import xSVG from '../assets/imgs/x.svg';
import genericTribeSVG from '../assets/imgs/generic-tribe.svg';
import logoutSVG from '../assets/imgs/logout.svg';
import adminSVG from '../assets/imgs/admin-tools.svg';

function getLogo() {
  const logo = new Image();
  logo.src = logoSVG;
  logo.alt = 'Yapp logo';

  return logo;
}

function getXIcon() {
  const x = new Image();
  x.src = xSVG;
  x.alt = 'A cross in a circle';
  x.className = 'modal-close-btn-icon';

  return x;
}

function getSearchBarIcons(searchWrapper) {
  const searchIconWrapper = document.createElement('div');
  searchIconWrapper.className = 'search-icon-wrapper-outer';
  searchIconWrapper.innerHTML = `
    <div class="search-icon-wrapper-inner">
      <button class="invisible-btn"></button>
      <div class="magnifying-glass"></div>
      <div class="magnifying-glass-handle left"></div>
      <div class="magnifying-glass-handle right"></div>
    </div>
  `;

  const btn = searchIconWrapper.querySelector('.invisible-btn');

  btn.addEventListener('click', (ev) => {
    ev.stopImmediatePropagation();
    
    if (searchWrapper.classList.contains('minimized')) {
      searchWrapper.classList.remove('minimized');
    } else {
      searchWrapper.classList.add('minimized');
    }
  });

  return searchIconWrapper;
}

function getGenericTribeIcon() {
  const generic = new Image();
  generic.src = genericTribeSVG;
  generic.alt = 'Generic tribe icon';
  generic.className = 'tribe-icon'

  return generic;
}

function convertAsciiToIcon(iconObject) {
  const ascii = iconObject.data;
  const base64String = String.fromCharCode(...ascii);

  const svgString = btoa(base64String);
  const svgUrl = 'data:image/svg+xml;base64,' + svgString;
  
  const icon = new Image();
  icon.src = svgUrl;
  icon.alt = 'Tribe icon';
  icon.className = 'tribe-icon';

  return icon;
}

function getSidebarIcons() {
  const home = new Image();
  home.src = homeSVG;
  home.alt = 'A house';

  const messages = new Image();
  messages.src = messagesSVG;
  messages.alt = 'An envelope';

  const friends = new Image();
  friends.src = friendsSVG;
  friends.alt = 'A person with magnifying glass';

  const logout = new Image();
  logout.src = logoutSVG;
  logout.alt = 'An open door';

  return [
    home,
    messages,
    friends,
    logout,
  ];
}

function getOptionalSidebarIcons(url) {
  switch (url) {
    case 'tribe-chat':
      const members = new Image();
      members.src = membersSVG;
      members.alt = '3 people';

      const applications = new Image();
      applications.src = applicationsSVG;
      applications.alt = 'An application letter';

      return [members, applications];

    default:
      break;
  }
}

function getAdminSidebarIcons() {
  const admin = new Image();
  admin.src = adminSVG;
  admin.alt = 'A guy';

  return admin;
}

function getDashboardIcons(dashboardGrid) {
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

  const cards = Array.from(dashboardGrid.querySelectorAll('.dashboard-card'));
  const texts = Array.from(dashboardGrid.querySelectorAll('.card-text'));
  const images = [
    gatheringIcon,
    formTribeIcon,
    joinTribeIcon,
    planGatheringIcon,
    tribeIcon,
    reportIssueIcon,
  ];

  for (let i = 0; i < cards.length; i += 1) {
    images[i].className = 'card-icon';
    cards[i].insertBefore(images[i], texts[i]);
  }
}

export {
  getDashboardIcons,
  getSidebarIcons,
  getOptionalSidebarIcons,
  getLogo,
  getAdminSidebarIcons,
  getXIcon,
  getGenericTribeIcon,
  getSearchBarIcons,
  convertAsciiToIcon,
};


