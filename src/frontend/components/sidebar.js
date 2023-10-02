import fetchPage from './fetch_apis';
import logoSVG from '../assets/imgs/logo.svg';
import homeSVG from '../assets/imgs/home.svg';
import messagesSVG from '../assets/imgs/envelope.svg';


function getIcons() {
  const home = new Image();
  home.src = homeSVG;
  home.alt = 'A house';

  const messages = new Image();
  messages.src = messagesSVG;
  messages.alt = 'An envelope';

  return [
    home,
    messages,
  ];
}

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

  const icons = getIcons();
  const listItems = Array.from(sidebarListFlex.querySelectorAll('.sidebar-list-anchor'));

  listItems.forEach((item, index) => {
    item.addEventListener('click', () => {
      fetchPage(item.getAttribute('data-link'));
    });

    icons[index].className = 'sidebar-list-icon';
    item.appendChild(icons[index]);
  });

  sidebarContainer.appendChild(logo);
  sidebarContainer.appendChild(sidebarListFlex);

  return sidebarContainer;
}
