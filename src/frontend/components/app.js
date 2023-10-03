import Header from './header';
import Sidebar from './sidebar';
import HamburgerBtn from './hamburger-btn';
import Dashboard from './dashboard';
import { importedComponents, getComponent } from './fetch_apis';

function clientRouting() {
  const currentRoute = window.location.pathname;
  let component;

  switch (currentRoute) {

    case '/':
      component = Dashboard();
      return component;

    case '/join-a-tribe':
      component = getComponent(importedComponents.joinTribe);
      return component;


    case '/report-user-issue':
      component = getComponent(importedComponents.reportUserForm);
      return component;

    default:
      component = Dashboard();
      return component;
  }
}

export default function App() {
  const appContainer = document.createElement('div');
  appContainer.classList.add('app-container');
  appContainer.id = 'app';

  appContainer.appendChild(Header());
  appContainer.appendChild(clientRouting());
  appContainer.appendChild(Sidebar());
  appContainer.appendChild(HamburgerBtn());

  return appContainer;
}
