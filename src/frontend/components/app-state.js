function updateAppState(key, value) {
  if (typeof value === 'object') {
    try {
      const obj = JSON.stringify(value);
      console.log("Stringified object =>", obj);
      sessionStorage.setItem(key, obj);
    } catch (error) {
      console.error("Error converting object to JSON => ", error);
    }
  } else {
    sessionStorage.setItem(key, value);
  }
}

function getAppState(key) {
  if (key === 'header-tribe-suggestions') {
    try {
      const value = sessionStorage.getItem(key);
      const obj = JSON.parse(value);
      return obj;
    } catch (error) {
      console.error("Error parsing JSON object => ", error);
    }
  } else {
    return sessionStorage.getItem(key);
  }
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
