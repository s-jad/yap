import { clearNewMessages, getAppState, storeUserMessages, updateUserMessages  } from './app-state';
import {
  emitNewInboxMsgEvent,
  emitUpdateSearchbarEvent,
} from './events';
import { 
  handleClientSideLinks,
  handleSidebarOptionalLinks,
} from './fetch_apis';
import {
  getSidebarIcons,
  getOptionalSidebarIcons,
  getLogo,
  getAdminSidebarIcons,
} from './icons';
import { notificationsSocket } from './sockets';
import { getInboxMessages } from './tribes-db-access';

async function fetchUserMessages() {
  const messages = await getInboxMessages();

  clearNewMessages();

  const userMessagesArr = [];
  let inboxCount = 0;
  messages.forEach((msg) => {
    userMessagesArr.push(msg);
    if (
      msg.receiver_name === getAppState('username')
      && !msg.message_read
    ) {
      inboxCount += 1;
    }
  });

  storeUserMessages(userMessagesArr);

  return inboxCount;
}

function getOptionalSidebarItems(urls, memberStatus) {
  let optionalListFlex = document.createElement('ul');
  optionalListFlex.className = 'optional-list-flex';

  if (urls[0] === 'tribe-chat') {
    const tribe = urls[1];
    optionalListFlex = setSidebarTribeChat(optionalListFlex, tribe, memberStatus);
  }
  
  if (getAppState('userRole') === 'admin') {
    const adminTools = document.createElement('li');
    adminTools.className = 'sidebar-list-item admin-dashboard';
    const adminToolLink = document.createElement('a')
    adminToolLink.className = 'sidebar-list-anchor'
    adminToolLink.setAttribute('data-link', '/admin-dashboard')
    adminToolLink.href = 'admin-dashboard';
    adminToolLink.addEventListener('click', (ev) => {
      ev.preventDefault();
      const url = adminToolLink.getAttribute('data-link');
      history.pushState(null, null, url);
      handleClientSideLinks(url);
    });
    const icon = getAdminSidebarIcons();
    icon.className = 'sidebar-list-icon';
    adminToolLink.appendChild(icon);
    adminTools.appendChild(adminToolLink);
    optionalListFlex.appendChild(adminTools);
  }

  return optionalListFlex;
}

function setSidebarTribeChat(optionalListFlex, tribe, memberStatus) {
  if (
      memberStatus === 'mod' 
      || memberStatus === 'admin'
      || memberStatus === 'founder'
  ) {
    optionalListFlex.innerHTML = `
      <li class="sidebar-list-item">
        <a class="sidebar-list-anchor"
          data-link="/tribe-chat/${tribe}/members" 
          href="/api/tribe-chat/${tribe}/members"></a>
      </li>
      <li class="sidebar-list-item">
        <a class="sidebar-list-anchor"
          data-link="/tribe-chat/${tribe}/applications" 
          href="/api/tribe-chat/${tribe}/applications"></a>
      </li>
    `;
  } else {
    optionalListFlex.innerHTML = `
      <li class="sidebar-list-item">
      <a class="sidebar-list-anchor"
        data-link="/tribe-chat/${tribe}/members"
        href="/api/tribe-chat/${tribe}/members"></a>
      </li>
    `;
  } 

  const links = Array.from(optionalListFlex.querySelectorAll('a'));
  const icons = getOptionalSidebarIcons('tribe-chat');
   
  links.forEach((link, index) => {
    link.addEventListener('click', (ev) => {
      ev.preventDefault();
      const url = link.getAttribute('data-link');
      history.pushState(null, null, url);
      handleSidebarOptionalLinks(url);
    });
    icons[index].className = 'sidebar-list-icon';
    link.appendChild(icons[index]);
  });

  return optionalListFlex;
}

export default async function Sidebar(urls) {
  const sidebarContainer = document.createElement('div');
  sidebarContainer.className = 'sidebar-container hideable';

  const logo = getLogo();

  const sidebarListFlex = document.createElement('ul');
  sidebarListFlex.className = 'sidebar-list-flex';
  sidebarListFlex.innerHTML = `
    <li class="sidebar-list-item"><a class="sidebar-list-anchor" data-link="/dashboard" href="/dashboard"></a></li>
    <li class="sidebar-list-item inbox-icon"><a class="sidebar-list-anchor" data-link="/inbox" href="/inbox"></a></li>
    <li class="sidebar-list-item"><a class="sidebar-list-anchor" data-link="/friends" href="/friends"></a></li>
    <li class="sidebar-list-item"><a class="sidebar-list-anchor" data-link="/logout" href="/logout"></a></li>
  `;
  
  const inboxAnchor = sidebarListFlex.querySelector('a[data-link="/inbox"]');

  let msgCount = await fetchUserMessages();
  const inboxMsgCount = document.createElement('div'); 
 
  if (msgCount !== 0) {
    inboxMsgCount.className = 'inbox-msg-count';
    inboxMsgCount.innerText = `${msgCount}`;
    inboxAnchor.appendChild(inboxMsgCount);
  }

  notificationsSocket.on('new-inbox-message', (newMsg) => {
    console.log("received new inbox message");
    msgCount += 1;
    inboxMsgCount.innerText = msgCount;
    updateUserMessages(newMsg);

    const removableComponent = document.body.querySelector('.removable');

    if (removableComponent.classList.contains('user-messages-container')) {
      emitNewInboxMsgEvent(removableComponent, newMsg);

      const searchbar = removableComponent.querySelector('.searchbar');
      if (searchbar) {
        emitUpdateSearchbarEvent(searchbar);
      }
    }
  });

  const icons = getSidebarIcons();
  const links = Array.from(sidebarListFlex.querySelectorAll('[data-link]'));

  links.forEach((link, index) => {
    link.addEventListener('click', (ev) => {
      ev.preventDefault();
      const url = link.getAttribute('data-link');
      history.pushState(null, null, url);
      handleClientSideLinks(url);
    });

    icons[index].className = 'sidebar-list-icon';
    link.appendChild(icons[index]);
  });
  
  const optionalListFlex = getOptionalSidebarItems(urls);
  sidebarContainer.appendChild(logo);
  sidebarContainer.appendChild(sidebarListFlex);
  sidebarContainer.appendChild(optionalListFlex);
  
  sidebarContainer.addEventListener('sidebar-link-change', (ev) => {
    const newUrls = []
    const currentUrlSplit = ev.detail.currentUrl.split('/');
    const memberStatus = ev.detail.memberStatus;
    newUrls.push(currentUrlSplit[1], currentUrlSplit[2]);
    const toRemove = sidebarContainer.querySelector('.optional-list-flex');
    sidebarContainer.removeChild(toRemove);
    const newOptionalListFlex = getOptionalSidebarItems(newUrls, memberStatus);
    sidebarContainer.appendChild(newOptionalListFlex);
  });

  return sidebarContainer;
}

