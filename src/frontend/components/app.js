import Header from './header';
import Sidebar from './sidebar';
import HamburgerBtn from './hamburger-btn';

import Dashboard from './dashboard';
import ReportUserIncidentForm from './report-user-form';

function clientRouting() {
  const currentRoute = window.location.pathname;
  let component;

  switch (currentRoute) {

    case '/dashboard':
      component = Dashboard();
      return component;

    case '/report-user-issue':
      component = ReportUserIncidentForm();
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
