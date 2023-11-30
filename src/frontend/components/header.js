import { getAppState, notificationsArr } from "./app-state";
import { handleChatroomLinks, handleClientSideLinks } from "./fetch_apis";
import { convertAsciiToIcon, getHeaderNotificationIcons } from "./icons";
import { notificationsSocket } from "./sockets";
import { getLastTribeLogins, getNotifications } from "./tribes-db-access";

async function getNotificationLinks() {
  const notificationsFlex = document.createElement('div');
  notificationsFlex.className = 'notifications-flex';

  const notifications = await getNotifications();
  let fnCount = 0, tnCount = 0, ynCount = 0;

  notifications.forEach((n) => {
    notificationsArr.push(n);
    switch (n.notification_type) {
      case 'friends':
        fnCount += 1;
        break;

      case 'tribe':
        tnCount += 1;
        break;

      case 'yapp':
        ynCount += 1;
        break;
    }
  });

  notificationsFlex.innerHTML = `
    <div class="notify-friends" data-focus="friends">
      <p class="fn-alert">${fnCount}</p>
    </div>
    <div class="notify-tribes" data-focus="tribe">
      <p class="tn-alert">${tnCount}</p>
    </div>
    <div class="notify-yapp" data-focus="yapp">
      <p class="yn-alert">${ynCount}</p>
    </div>
  `;

  const notificationLinks = Array.from(notificationsFlex.querySelectorAll('[class^="notify"]'));
  const notificationIcons = getHeaderNotificationIcons();
  notificationLinks.forEach((link, index) => {
    const focus = link.getAttribute('data-focus');
    link.appendChild(notificationIcons[index])
    link.addEventListener('click', () => {
      handleClientSideLinks('/notifications', focus);
    });
  });

  const ynAlert = notificationsFlex.querySelector('.yn-alert');
  const fnAlert = notificationsFlex.querySelector('.fn-alert');
  const tnAlert = notificationsFlex.querySelector('.tn-alert');
  
  notificationsSocket.on('notification', (data) => {
    switch (data.type) {
      case 'yapp':
        ynCount += 1;
        ynAlert.innerText = ynCount;
        break;

      case 'friends':
        fnCount += 1;
        fnAlert.innerText = fnCount;
        break;

      case 'tribe':
        tnCount += 1;
        tnAlert.innerText = tnCount;
        break;
    }
  });

  return notificationsFlex;
}

async function getGroupsLinks() {
  const groupLinksContainer = document.createElement('div');
  groupLinksContainer.className = 'group-links-container';
  
  let tribeSuggestions = getAppState('header-tribe-suggestions');

  if (tribeSuggestions === undefined || tribeSuggestions === null) {
    tribeSuggestions = await getLastTribeLogins();
  }
  
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
    const tribeUrl = `/${tribeSuggestions[index].tribe_name.replaceAll(' ', '-')}`;
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
  const notificationLinks = await getNotificationLinks();
  headerContainer.appendChild(userName);
  headerContainer.appendChild(groupLinksContainer);
  headerContainer.appendChild(notificationLinks);

  return headerContainer;
}
