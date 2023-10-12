import { getAppState } from "./app-state";
import { handleChatroomLinks } from "./fetch_apis";

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

  const lastLogins = getAppState('last-tribe-logins');
  groupLinksContainer.innerHTML = `
    <ul class='group-list'>
      <a class="recently-viewed-tribe-link"><li class='group-list-item'></li></a>
      <a class="recently-viewed-tribe-link"><li class='group-list-item'></li></a>
      <a class="recently-viewed-tribe-link"><li class='group-list-item'></li></a>
    </ul>
  `;

  const anchors = Array.from(groupLinksContainer.querySelectorAll('a'));
  const links = Array.from(groupLinksContainer.querySelectorAll('li'));

  anchors.forEach((a, index) => {
    links[index].textContent = lastLogins[index].tribe_name;
    const tribeUrl = `/${lastLogins[index].tribe_name.toLowerCase().replaceAll(' ', '-')}`;
    a.href = `/api/protected/tribe-chat${tribeUrl}`;
    a.setAttribute('data-link', `/tribe-chat${tribeUrl}`);
    a.tabIndex = index + 1;

    a.addEventListener('click', (ev) => {
      ev.preventDefault();
      const linkUrl = a.getAttribute('data-link');
      history.pushState(null, null, linkUrl);
      handleChatroomLinks(tribeUrl);
    });
  });

  return groupLinksContainer;
}

export default function Header() {
  const headerContainer = document.createElement('div');
  headerContainer.className = 'header-container';

  const userName = document.createElement('h1');
  userName.className = 'username-title';
  userName.textContent = getAppState('username');

  const groupLinksContainer = getGroupsLinks();

  headerContainer.appendChild(userName);
  headerContainer.appendChild(groupLinksContainer);
  headerContainer.appendChild(getNotifications());

  return headerContainer;
}
