import { getAppState, updateAppState } from './app-state';
import { emitFocusEvent, emitSetupSearchbarEvent, emitSidebarLinkEvent } from './events';
import { getTribeApplicationsListModal, getTribeMembersListModal } from './modals';
import {
  chatroomSocket,
  disconnectSocket,
  getSocketInitState,
  initialiseSocket,
} from './sockets';
import { logoutUser } from './tribes-db-access';

let prevChatroom;

const importedList = {
  reportUserForm: false,
  joinTribe: false,
  createTribe: false,
  tribeChat: false,
  messagesDashboard: false,
  friendsDashboard: false,
  notificationsDashboard: false,
};

const importedComponents = {
  dashboard: () => { },
  reportUserForm: () => { },
  joinTribe: () => { },
  createTribe: () => { },
  tribeChat: () => { },
  messagesDashboard: () => { },
  friendsDashboard: () => { },
  notificationsDashboard: () => { },
}

function getComponent(fn) {
  const component = fn();
  return component;
}

async function getChatroom(fn, tribe) {
  prevChatroom = getAppState('current-room');

  if (getSocketInitState('/tribe-chat')) {
    disconnectSocket('/tribe-chat');
  }

  initialiseSocket('/tribe-chat');
  const chatroom = await fn(tribe);
  return chatroom;
}

async function getAsyncComponent(fn) {
  const component = await fn();
  return component;
}

function importChatroom(tribe) {
  return new Promise(async (resolve, reject) => {
    let chatroom;
    if (importedList.tribeChat !== true) {
      try {
        const tribeChatModule = await import(/* webpackChunkName: "get-tribe-chatroom" */ './get-tribe-chatroom.js')
        const TribeChat = tribeChatModule.default;
        const fn = TribeChat;
        importedList.tribeChat = true;
        importedComponents.tribeChat = fn;
        chatroom = getChatroom(fn, tribe)
        resolve(chatroom);
      }
      catch (error) {
        console.error(error);
        reject(error);
      }
    } else {
      chatroom = getChatroom(importedComponents.tribeChat, tribe);
      resolve(chatroom);
    }
  });
}

function importModules(page) {
  return new Promise(async (resolve, reject) => {
    let component;
    switch (page) {
      case '/dashboard':
        component = getComponent(importedComponents.dashboard);
        resolve(component);
        break;

      case '/report-user-issue':
        if (importedList.reportUserForm !== true) {
          try {
            const reportUserModule = await import(/* webpackChunkName: "report-user-form" */ './report-user-form');
            const ReportUserIncidentForm = reportUserModule.default;
            const fn = ReportUserIncidentForm;
            importedList.reportUserForm = true;
            importedComponents.reportUserForm = fn;
            component = getComponent(fn)
            resolve(component);
          } catch (error) {
            console.error(error);
            reject(error);
          }
        } else {
          component = getComponent(importedComponents.reportUserForm);
          resolve(component);
        }
        break;

      case '/join-a-tribe':
        if (importedList.joinTribe !== true) {
          try {
            const joinTribeModule = await import(/* webpackChunkName: "join-a-tribe" */ './join-a-tribe')
            const JoinTribe = joinTribeModule.default;
            const fn = JoinTribe;
            importedList.joinTribe = true;
            importedComponents.joinTribe = fn;
            component = getAsyncComponent(fn)
            resolve(component);
          }
          catch (error) {
            console.error(error);
            reject(error);
          }
        } else {
          component = getAsyncComponent(importedComponents.joinTribe);
          resolve(component);
        }
        break;

      case '/friends':
        if (importedList.inbox !== true) {
          try {
            const friendsModule = await import(/* webpackChunkName: "friends" */ './friends')
            const friendsDashboard = friendsModule.default;
            const fn = friendsDashboard;
            importedList.friendsDashboard = true;
            importedComponents.friendsDashboard = fn;
            component = getAsyncComponent(fn)
            resolve(component);
          }
          catch (error) {
            console.error(error);
            reject(error);
          }
        } else {
          component = getAsyncComponent(importedComponents.friendsDashboard);
          resolve(component);
        }
        break;

      case '/inbox':
        if (importedList.inbox !== true) {
          try {
            const messagesDashboardModule = await import(/* webpackChunkName: "inbox" */ './inbox')
            const MessagesDashboard = messagesDashboardModule.default;
            const fn = MessagesDashboard;
            importedList.messagesDashboard = true;
            importedComponents.messagesDashboard = fn;
            component = getComponent(fn)
            resolve(component);
          }
          catch (error) {
            console.error(error);
            reject(error);
          }
        } else {
          component = getComponent(importedComponents.messagesDashboard);
          resolve(component);
        }
        break;

      case '/notifications':
        if (importedList.notifications !== true) {
          try {
            const notificationsDashboardModule = await import(/* webpackChunkName: "notifications" */ './notifications')
            const NotificationsDashboard = notificationsDashboardModule.default;
            const fn = NotificationsDashboard;
            importedList.notificationsDashboard = true;
            importedComponents.notificationsDashboard = fn;
            component = getAsyncComponent(fn)
            resolve(component);
          }
          catch (error) {
            console.error(error);
            reject(error);
          }
        } else {
          component = getAsyncComponent(importedComponents.notificationsDashboard);
          resolve(component);
        }
        break;

      case '/create-a-tribe':
        if (importedList.createTribe !== true) {
          try {
            const createTribeModule = await import(/* webpackChunkName: "create-a-tribe" */ './create-a-tribe')
            const CreateTribe = createTribeModule.default;
            const fn = CreateTribe;
            importedList.createTribe = true;
            importedComponents.createTribe = fn;
            component = getComponent(fn)
            resolve(component);
          }
          catch (error) {
            console.error(error);
            reject(error);
          }
        } else {
          component = getComponent(importedComponents.createTribe);
          resolve(component);
        }
        break;

      default:
        resolve(null);
        break;
    }
  });
}

function handleCreateTribe(form) {
  form.addEventListener('submit', (event) => {
    event.preventDefault();

    const formData = new FormData(form);
    const formationDate = new Date().toISOString().slice(0, 10);
    formData.append('formationDate', formationDate);

    fetch('/api/protected/create-a-tribe', {
      method: 'POST',
      body: formData,
    })
      .then((response) => {
        return response.json();
      })
      .then((data) => {
        const newTribeName = data.newTribeName;
        if (newTribeName) {
          const tribeUrl = newTribeName.replaceAll(' ', '-');
          const newUrl = `/tribe-chat/${tribeUrl}`;
          history.pushState(null, null, newUrl);
          handleChatroomLinks(newTribeName, 'founder');
        }
      })
      .catch((error) => {
        console.error('handlePostTribe::Error:', error);
      });
  });
}

async function handleSidebarOptionalLinks(url) {
  const urlSplit = url.split('/');

  switch (urlSplit[1]) {
    case 'tribe-chat':
      const tribe = `${urlSplit[2]}`
        .replaceAll('-', ' ');

      if (urlSplit[3] === 'members') {
        await getTribeMembersListModal(tribe);
      } else if (urlSplit[3] === 'applications') {
        await getTribeApplicationsListModal(tribe);
      }
      break;

    default:
      break;
  }
}

function handleChatroomLinks(tribe, memberStatus) {
  const app = document.body.querySelector('#app');
  const toRemove = app.querySelector('.removable');

  importChatroom(tribe)
    .then((toAdd) => {
      if (toAdd) {
        app.removeChild(toRemove);
        app.appendChild(toAdd);

        const tribeName = tribe
          .replaceAll('-', ' ')
          .replace('/', '');

        if (prevChatroom !== tribeName
            && prevChatroom !== undefined 
        ) {
          console.log(`Leaving ${prevChatroom}`);
          chatroomSocket.emit('leave chatroom', prevChatroom);
        }
        chatroomSocket.emit('join chatroom', tribeName);
        emitSidebarLinkEvent(memberStatus);
      }
    })
    .catch((error) => {
      console.error(error);
    });
}

function deleteCookie(name) {
  document.cookie = name + '=; expires= Thu, 01 Jan 1970 00:00:01 GMT;';
}

async function handleLogout() {
  const logout = await logoutUser();
  if (logout) {
    deleteCookie('jwt_payload');
    deleteCookie('jwt_signature');
    disconnectSocket('/inbox');
    if (getSocketInitState('/tribe-chat')) {
      disconnectSocket('/tribe-chat');
    }

    setTimeout(() => {
      window.location.href = '/';
    }, 100);
  }
}

function handleClientSideLinks(page, focus) {
  const app = document.body.querySelector('#app');
  const toRemove = app.querySelector('.removable');
  
  if (getSocketInitState('/tribe-chat')) {
    console.log(`Leaving ${prevChatroom}`);
    chatroomSocket.emit('leave chatroom', prevChatroom);
    disconnectSocket('/tribe-chat');
  }

  if (page === '/logout') {
    handleLogout();
    return;
  }

  importModules(page)
    .then((toAdd) => {
      if (toAdd) {
        app.removeChild(toRemove);
        app.appendChild(toAdd);

        if (focus) {
          emitFocusEvent(page, toAdd, focus);
        }

        const searchable = app.querySelector('.searchable');
        if (searchable) {
          emitSetupSearchbarEvent(searchable);
        }

        emitSidebarLinkEvent();
      }
    })
    .catch((error) => {
      console.error(error);
    });
}

export {
  handleClientSideLinks,
  handleChatroomLinks,
  handleCreateTribe,
  handleSidebarOptionalLinks,
  importModules,
  importChatroom,
  importedComponents,
  getComponent,
  getAsyncComponent,
  getChatroom,
};
