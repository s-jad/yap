import Header from './header';
import Dashboard from './dashboard';
import Sidebar from './sidebar';
import HamburgerBtn from './hamburger-btn';

export default function App() {
  const appContainer = document.createElement('div');
  appContainer.classList.add('app-container');
  appContainer.id = 'app';

  appContainer.appendChild(Header());
  appContainer.appendChild(Dashboard());
  appContainer.appendChild(Sidebar());
  appContainer.appendChild(HamburgerBtn());

  return appContainer;
}
