import { getAppState } from './app-state';
import { emitFocusEvent, emitSidebarLinkEvent } from './events';
import { getTribeApplicationsListModal, getTribeMembersListModal } from './modals';
import { disconnectSocket, getSocketInitState, initialiseSocket, socket } from './sockets';

let prevChatroom;

const importedList = {
  reportUserForm: false,
  joinTribe: false,
  createTribe: false,
  tribeChat: false,
  messagesDashboard: false,
  friendsDashboard: false,
};

const importedComponents = {
  dashboard: () => { },
  reportUserForm: () => { },
  joinTribe: () => { },
  createTribe: () => { },
  tribeChat: () => { },
  messagesDashboard: () => { },
  friendsDashboard: () => { },
}

function getComponent(fn) {
  const component = fn();
  return component;
}

async function getChatroom(fn, tribe) {
  prevChatroom = getAppState('current-room');

  if (getSocketInitState()) {
    disconnectSocket();
  }

  initialiseSocket();
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
            component = getAsyncComponent(fn)
            resolve(component);
          }
          catch (error) {
            console.error(error);
            reject(error);
          }
        } else {
          component = getAsyncComponent(importedComponents.messagesDashboard);
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
    const tribeData = Object.fromEntries(formData.entries());
    const formationDate = new Date().toISOString().slice(0, 10);
    const foundingMember = getAppState('username');
    const valuesArr = [
      tribeData.tribeName,
      tribeData.tribeCta,
      tribeData.tribeDescription,
      formationDate,
      foundingMember
    ];

    fetch('/api/protected/create-a-tribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(valuesArr),
    })
      .then((response) => {
        return response.json();
      })
      .then((data) => {
        const newTribeName = data.tribe;
        if (newTribeName) {
          const tribeUrl = newTribeName.toLowerCase().replaceAll(' ', '-');
          const newUrl = `/join-a-tribe/${tribeUrl}`;
          history.pushState(null, null, newUrl);
          handleChatroomLinks(newTribeName);
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
      const tribe = `/${urlSplit[2]}`
        .replace(/-([a-z])/g, function(g) { return ' ' + g[1].toUpperCase(); })
        .replace(/\/([a-z])/g, function(g) { return '' + g[1].toUpperCase(); });

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
          .replace(/-([a-z])/g, function(g) { return ' ' + g[1].toUpperCase(); })
          .replace(/\/([a-z])/g, function(g) { return '' + g[1].toUpperCase(); });

        if (prevChatroom !== tribeName) {
          console.log(`Leaving ${prevChatroom}`);
          socket.emit('leave chatroom', prevChatroom);
        }
        socket.emit('join chatroom', tribeName);

        emitSidebarLinkEvent(memberStatus);
      }
    })
    .catch((error) => {
      console.error(error);
    });
}

function handleClientSideLinks(page, focus) {
  const app = document.body.querySelector('#app');
  const toRemove = app.querySelector('.removable');

  if (getSocketInitState()) {
    disconnectSocket();
  }

  importModules(page)
    .then((toAdd) => {
      if (toAdd) {
        app.removeChild(toRemove);
        app.appendChild(toAdd);

        if (focus) {
          emitFocusEvent(page, toAdd, focus);
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
