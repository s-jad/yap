import logoSVG from '../assets/imgs/logo.svg';

export default function Sidebar() {
  const sidebarContainer = document.createElement('div');
  sidebarContainer.className = 'sidebar-container';

  const logo = new Image();
  logo.className = 'logo';
  logo.src = logoSVG;

  sidebarContainer.appendChild(logo);

  return sidebarContainer;
}
