import Header from './header';
import Sidebar from './sidebar';
import HamburgerBtn from './hamburger-btn';
import Dashboard from './dashboard';
import { importedComponents, getComponent, getAsyncComponent } from './fetch_apis';

async function clientRouting() {
  const currentRoute = window.location.pathname;
  let component;

  switch (currentRoute) {

    case '/':
      component = Dashboard();
      return component;

    case '/join-a-tribe':
      component = await getAsyncComponent(importedComponents.joinTribe);
      console.log(component);
      return component;


    case '/report-user-issue':
      component = getComponent(importedComponents.reportUserForm);
      return component;

    default:
      component = Dashboard();
      return component;
  }
}

export default async function App() {
  const appContainer = document.createElement('div');
  appContainer.classList.add('app-container');
  appContainer.id = 'app';

  const currentRoute = await clientRouting();
  
  appContainer.appendChild(Header());
  appContainer.appendChild(currentRoute);
  appContainer.appendChild(Sidebar());
  appContainer.appendChild(HamburgerBtn());

  window.addEventListener('popstate', async() => {
    const toRemove = appContainer.querySelector('.removable');
    appContainer.removeChild(toRemove);
    const toAdd = await clientRouting();
    appContainer.appendChild(toAdd);
  });

  return appContainer;
}
