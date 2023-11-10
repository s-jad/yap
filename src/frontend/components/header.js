import { getAppState } from "./app-state";
import { handleChatroomLinks } from "./fetch_apis";
import { convertAsciiToIcon } from "./icons";
import { getLastTribeLogins } from "./tribes-db-access";

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

async function getGroupsLinks() {
  const groupLinksContainer = document.createElement('div');
  groupLinksContainer.className = 'group-links-container';
  
  let tribeSuggestions = getAppState('header-tribe-suggestions');

  if (tribeSuggestions === undefined || tribeSuggestions === null) {
    tribeSuggestions = await getLastTribeLogins();
  }
  
  console.log("tribeSuggestions => ", tribeSuggestions);
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
    const icon = convertAsciiToIcon(tribeSuggestions[index].tribe_icon);
    links[index].appendChild(icon);
    const tribeUrl = `/${tribeSuggestions[index].tribe_name.toLowerCase().replaceAll(' ', '-')}`;
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

export default async function Header() {
  const headerContainer = document.createElement('div');
  headerContainer.className = 'header-container';

  const userName = document.createElement('h1');
  userName.className = 'username-title';
  userName.textContent = getAppState('username');
  const groupLinksContainer = await getGroupsLinks();
  headerContainer.appendChild(userName);
  headerContainer.appendChild(groupLinksContainer);
  headerContainer.appendChild(getNotifications());

  return headerContainer;
}
