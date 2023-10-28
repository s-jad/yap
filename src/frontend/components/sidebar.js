import { 
  handleClientSideLinks,
  handleSidebarOptionalLinks,
} from './fetch_apis';
import {
  getSidebarIcons,
  getOptionalSidebarIcons,
  getLogo,
} from './icons';

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

export default function Sidebar(urls) {
  const sidebarContainer = document.createElement('div');
  sidebarContainer.className = 'sidebar-container hideable';

  const logo = getLogo();

  const sidebarListFlex = document.createElement('ul');
  sidebarListFlex.className = 'sidebar-list-flex';
  sidebarListFlex.innerHTML = `
    <li class="sidebar-list-item"><a class="sidebar-list-anchor" data-link="/dashboard" href="/dashboard"></a></li>
    <li class="sidebar-list-item"><a class="sidebar-list-anchor" data-link="/inbox" href="/inbox"></a></li>

  `;
  
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

  return sidebarContainer;
}

