const importedList = {
  reportUserForm: false,
};

const importedComponents = {
  dashboard: false,
  reportUserForm: false,
}

function getComponent(fn) {
  const component = fn();
  return component;
}

function importModules(page) {
  return new Promise((resolve, reject) => {
    let component;
    switch (page) {
      case '/dashboard':
        component = getComponent(importedComponents.dashboard);
        resolve(component);
        break;

      case '/report-user-issue':
        if (importedList.reportUserForm !== true) {
          import(/* webpackChunkName: "report-user-form" */ './report-user-form')
            .then((module) => {
              return module.default;
            })
            .then((ReportUserIncidentForm) => {
              const fn = ReportUserIncidentForm;
              importedList.reportUserForm = true;
              importedComponents.reportUserForm = fn;
              component = getComponent(fn)
              resolve(component);
            })
            .catch((error) => {
              console.error(error);
              reject(error);
            });
        } else {
          component = getComponent(importedComponents.reportUserForm);
          resolve(component);
        }
        break;

      default: 
        resolve(null);
        break;
    }
  });
}

function handleLinks(page) {
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
  handleLinks,
  importedComponents,
};
