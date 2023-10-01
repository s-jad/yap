import Header from './header';
import Dashboard from './dashboard';
import Sidebar from './sidebar';
import HamburgerBtn from './hamburger-btn';

function HomePage() {
  const homePageContainer = document.createElement('div'); 
  homePageContainer.id = 'home-page-container';
  homePageContainer.appendChild(Header());
  homePageContainer.appendChild(Dashboard());
  homePageContainer.appendChild(Sidebar());
  homePageContainer.appendChild(HamburgerBtn());

  return homePageContainer;
}

export default function App() {
  const appContainer = document.createElement('div');
  appContainer.classList.add('app-container');
  appContainer.id = 'app';

  appContainer.appendChild(HomePage());

  return appContainer;
}
