const importedList = {
  reportUserForm: false,
  joinTribe: false,
  createTribe: false,
  tribeChat: false,
};

const importedComponents = {
  dashboard: () => {},
  reportUserForm: () => {},
  joinTribe: () => {},
  createTribe: () => {},
  tribeChat: () => {},
}

function getComponent(fn) {
  const component = fn();
  return component;
}


async function getChatroom(fn, tribe) {
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
          const TribeChat =  tribeChatModule.default;
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
        console.log("importModules::getComponent => ", chatroom);
        resolve(chatroom);
      }
  });
}

function importModules(page) {
  return new Promise(async (resolve, reject) => {
    let component;
    switch (page) {
      case '/':
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
          } catch(error) {
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
            const JoinTribe =  joinTribeModule.default;
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
          console.log("importModules::getAsyncComponent => ", component);
          resolve(component);
        }
        break;

      case '/create-a-tribe':
        if (importedList.createTribe !== true) {
          try {
            const createTribeModule = await import(/* webpackChunkName: "create-a-tribe" */ './create-a-tribe')
            const CreateTribe =  createTribeModule.default;
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
          console.log("importModules::getAsyncComponent => ", component);
          resolve(component);
        }
        break;

      default:
        resolve(null);
        break;
    }
  });
}

function handleChatroomLinks(tribe) {
  const app = document.body.querySelector('#app');
  const toRemove = app.querySelector('.removable');

  importChatroom(tribe)
    .then((toAdd) => {
      if (toAdd) {
        app.removeChild(toRemove);
        app.appendChild(toAdd);
      }
    })
    .catch((error) => {
      console.error(error);
    });
}

function handleClientSideLinks(page) {
  const app = document.body.querySelector('#app');
  const toRemove = app.querySelector('.removable');

  importModules(page)
    .then((toAdd) => {
      if (toAdd) {
        app.removeChild(toRemove);
        app.appendChild(toAdd);
      }
    })
    .catch((error) => {
      console.error(error);
    });
}

export {
  handleClientSideLinks,
  handleChatroomLinks,
  importModules,
  importChatroom,
  importedComponents,
  getComponent,
  getAsyncComponent,
  getChatroom,
};
