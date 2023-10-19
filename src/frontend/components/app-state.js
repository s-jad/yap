const appState = new Map();

function updateAppState(key, value) {
  appState.set(key, value);
}

function getAppState(key) {
  return appState.get(key);
}

function showDialog(container, info, category, dialogType) {
  let dialog = container.querySelector(`.${category}`)

  if (!dialog) {
    dialog = document.createElement('dialog');
    dialog.className = `short-lived-dialog ${category} ${dialogType}`;
    dialog.open = true;
    dialog.innerHTML = `
        <p class="dialog-msg">${info}</p>
    `;

    container.appendChild(dialog);
  } else {
    dialog.open = true;
  }
  
  setTimeout(() => {
    dialog.open = false; 
  }, 2500);
}

export {
  updateAppState,
  getAppState,
  showDialog,
}
