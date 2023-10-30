import { 
  handleClientSideLinks,
  handleSidebarOptionalLinks,
} from './fetch_apis';
import {
  getSidebarIcons,
  getOptionalSidebarIcons,
  getLogo,
} from './icons';
import { getInboxMessageCount } from './tribes-db-access';

function getOptionalSidebarItems(urls) {
  const optionalItemContainer = document.createElement('ul');
  optionalItemContainer.className = 'optional-items-container';

  if (urls[0] === 'tribe-chat') {
    const tribe = urls[1];
    const res = setSidebarTribeChat(optionalItemContainer, tribe);
    return res;
  } else {
    return optionalItemContainer;
  }
}

function setSidebarTribeChat(optionalItemContainer, tribe) {
  optionalItemContainer.innerHTML = `
    <li class="sidebar-list-item">
      <a class="sidebar-list-anchor" data-link="/tribe-chat/${tribe}/members" href="/api/tribe-chat/${tribe}/members"></a>
    </li>
  `;

  const links = Array.from(optionalItemContainer.querySelectorAll('a'));
  const icon = getOptionalSidebarIcons('tribe-chat');
   
  links.forEach((link, index) => {
    link.addEventListener('click', (ev) => {
      ev.preventDefault();
      const url = link.getAttribute('data-link');
      history.pushState(null, null, url);
      handleSidebarOptionalLinks(url);
    });
    icon.className = 'sidebar-list-icon';
    link.appendChild(icon);
  });

  return optionalItemContainer;
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
  `;
  
  const inboxAnchor = sidebarListFlex.querySelector('a[data-link="/inbox"]');
  console.log(inboxAnchor);
  const msgCount = await getInboxMessageCount();
  
  if (msgCount !== 0) {
    const inboxMsgCount = document.createElement('div'); 
    inboxMsgCount.className = 'inbox-msg-count';
    inboxMsgCount.innerText = `${msgCount}`;
    inboxAnchor.appendChild(inboxMsgCount);
  }

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
    newUrls.push(currentUrlSplit[1], currentUrlSplit[2]);
    const toRemove = sidebarContainer.querySelector('.optional-items-container');
    const newOptionalListFlex = getOptionalSidebarItems(newUrls);
    sidebarContainer.removeChild(toRemove);
    sidebarContainer.appendChild(newOptionalListFlex);
  });

  return sidebarContainer;
}

