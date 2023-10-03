import { handleClientSideLinks } from './fetch_apis';
import logoSVG from '../assets/imgs/logo.svg';
import { getSidebarIcons } from './icons';

export default function Sidebar() {
  const sidebarContainer = document.createElement('div');
  sidebarContainer.className = 'sidebar-container hideable';

  const logo = new Image();
  logo.className = 'logo';
  logo.src = logoSVG;

  const sidebarListFlex = document.createElement('ul');
  sidebarListFlex.className = 'sidebar-list-flex';
  sidebarListFlex.innerHTML = `
    <li class="sidebar-list-item"><a class="sidebar-list-anchor" data-link="/" href="/"></a></li>
    <li class="sidebar-list-item"><a class="sidebar-list-anchor" href="#"></a></li>
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

  sidebarContainer.appendChild(logo);
  sidebarContainer.appendChild(sidebarListFlex);

  return sidebarContainer;
}

