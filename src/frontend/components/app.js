import Header from './header';
import Sidebar from './sidebar';
import HamburgerBtn from './hamburger-btn';
import Dashboard from './dashboard';
import {
  importedComponents,
  getComponent,
  getAsyncComponent,
  importModules,
  importChatroom,
  getChatroom, 
} from './fetch_apis';



async function clientRouting(currentRoute) {
  sessionStorage.setItem('lastPage', currentRoute);

  let component;

  if (currentRoute.includes('tribe-chat')) {
    const urlSplit = currentRoute.split('/');
    const tribeUrl = `/${urlSplit[2]}`;
    component = await getChatroom(importedComponents.tribeChat, tribeUrl);

    if (component === undefined) {
      component = importChatroom(tribeUrl);
    }

    return component;
  }

  switch (currentRoute) {

    case '/dashboard':
      component = Dashboard();
      return component;

    case '/inbox':
      component = await getAsyncComponent(importedComponents.messagesDashboard);

      if (component === undefined) {
        component = await importModules(currentRoute);
      }
      return component;

    case '/join-a-tribe':
      component = await getAsyncComponent(importedComponents.joinTribe);

      if (component === undefined) {
        component = await importModules(currentRoute);
      }
      return component;

    case '/create-a-tribe':
      component = getComponent(importedComponents.createTribe);

      if (component === undefined) {
        component = await importModules(currentRoute);
      }
      return component;

    case '/report-user-issue':
      component = getComponent(importedComponents.reportUserForm);

      if (component === undefined) {
        component = await importModules(currentRoute);
      }
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

  const currentRoute = window.location.pathname;
  const currentComponent = await clientRouting(currentRoute);
  
  let sidebarUrl;
  if (currentRoute.includes('tribe-chat')) {
    const urlSplit = currentRoute.split('/');
    sidebarUrl = urlSplit[1];
  }

  const header = await Header();
  appContainer.appendChild(header);
  appContainer.appendChild(currentComponent);
  appContainer.appendChild(Sidebar(sidebarUrl));
  appContainer.appendChild(HamburgerBtn());

  window.addEventListener('popstate', async() => {
    const toRemove = appContainer.querySelector('.removable');
    appContainer.removeChild(toRemove);
    const toAdd = await clientRouting();
    appContainer.appendChild(toAdd);
  });


  return appContainer;
}
