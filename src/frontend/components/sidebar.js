import { handleLinks } from './fetch_apis';
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
    <li class="sidebar-list-item"><a class="sidebar-list-anchor" data-link="/dashboard" href="#"></a></li>
    <li class="sidebar-list-item"><a class="sidebar-list-anchor" href="#"></a></li>
  `;

  const icons = getSidebarIcons();
  const listItems = Array.from(sidebarListFlex.querySelectorAll('[data-link]'));

  listItems.forEach((item, index) => {
    item.addEventListener('click', () => {
      handleLinks(item.getAttribute('data-link'));
    });

    icons[index].className = 'sidebar-list-icon';
    item.appendChild(icons[index]);
  });

  sidebarContainer.appendChild(logo);
  sidebarContainer.appendChild(sidebarListFlex);

  return sidebarContainer;
}

