import { getAppState } from "./app-state";

function getNotifications() {
  const notificationsFlex = document.createElement('div');
  notificationsFlex.className = 'notifications-flex';

  notificationsFlex.innerHTML = `
    <div class="notify-friends">
      <p class="fn-alert">0</p>
    </div>
    <div class="notify-groups">
      <p class="gn-alert">3</p>
    </div>
    <div class="notify-yapp">
      <p class="yn-alert">12</p>
    </div>
  `;

  return notificationsFlex;
}

function getGroupsLinks() {
  const groupLinksContainer = document.createElement('div');
  groupLinksContainer.className = 'group-links-container';

  groupLinksContainer.innerHTML = `
    <ul class='group-list'>
      <li class='group-list-item'>Politics</li>
      <li class='group-list-item'>Animal Collective</li>
      <li class='group-list-item'>House music lovers</li>
    </ul>
  `;

  return groupLinksContainer;
}

export default function Header() {
  const headerContainer = document.createElement('div');
  headerContainer.className = 'header-container';

  const userName = document.createElement('h1');
  userName.className = 'username-title';
  userName.textContent = getAppState('username');

  headerContainer.appendChild(userName);
  headerContainer.appendChild(getGroupsLinks());
  headerContainer.appendChild(getNotifications());

  return headerContainer;
}
