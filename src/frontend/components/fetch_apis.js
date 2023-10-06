const importedList = {
  reportUserForm: false,
  joinTribe: false,
};

const importedComponents = {
  dashboard: () => {},
  reportUserForm: () => {},
  joinTribe: () => {},
}

function getComponent(fn) {
  const component = fn();
  return component;
}

async function getAsyncComponent(fn) {
  const component = await fn();
  return component;
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

      default:
        resolve(null);
        break;
    }
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
  importModules,
  importedComponents,
  getComponent,
  getAsyncComponent,
};
