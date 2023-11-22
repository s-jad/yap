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
import { emitSetupSearchbarEvent } from './events';
import { notificationsSocket } from './sockets';

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

function renderNotification(n) {
  const nWrapper = document.createElement('div');
  nWrapper.className = `notification-wrapper ${n.notification_type}`;
  
  nWrapper.innerHTML = `
    <h3 class="notification-sender">${n.notification_sender}</h3>
    <p class="notification-content">${n.notification_content}</p>
  `;

  return nWrapper;
}

function setupNotifications(appContainer) {
  notificationsSocket.on('yapp-notification', (n) => {
    const notification = renderNotification(n); 
    appContainer.appendChild(notification);
    setTimeout(() => {
      appContainer.removeChild(notification);
    }, 3000);
  });
}

export default async function App() {
  const appContainer = document.createElement('div');
  appContainer.classList.add('app-container');
  appContainer.id = 'app';

  const currentRoute = window.location.pathname;
  const currentComponent = await clientRouting(currentRoute);
  
  const urls = [];
  if (currentRoute.includes('tribe-chat')) {
    const urlSplit = currentRoute.split('/');
    const sidebarUrl = urlSplit[1];
    const chatroomUrl = urlSplit[2];
    urls.push(sidebarUrl, chatroomUrl);
  }

  const header = await Header();
  const sidebar = await Sidebar(urls);
  appContainer.appendChild(header);
  appContainer.appendChild(currentComponent);
  appContainer.appendChild(sidebar);
  appContainer.appendChild(HamburgerBtn());

  if (currentRoute === '/inbox') {
    const searchable = currentComponent.querySelector('.searchable')
    emitSetupSearchbarEvent(searchable);
  }

  window.addEventListener('popstate', async() => {
    const toRemove = appContainer.querySelector('.removable');
    const prevRoute = window.location.pathname;
    appContainer.removeChild(toRemove);
    const toAdd = await clientRouting(prevRoute);
    appContainer.appendChild(toAdd);

    if (prevRoute === '/inbox') {
      const searchable = toAdd.querySelector('.searchable')
      emitSetupSearchbarEvent(searchable);
    }
  });

  setupNotifications(appContainer);

  return appContainer;
}
