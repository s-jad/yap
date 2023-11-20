import '../styles/dialog.css';

function updateAppState(key, value) {
  if (typeof value === 'object') {
    try {
      const obj = JSON.stringify(value);
      sessionStorage.setItem(key, obj);
    } catch (error) {
      console.error("Error converting object to JSON => ", error);
    }
  } else if (key === 'username') {
    localStorage.setItem(key, value);
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
  } else if (key === 'username') {
    return localStorage.getItem(key);
  } else {
    return sessionStorage.getItem(key);
  }
}

function showDialog(container, info, category, dialogType, position) {
  let dialog = container.querySelector(`.${category}`)

  if (!dialog) {
    dialog = document.createElement('dialog');
    dialog.className = `short-lived-dialog ${category} ${dialogType} ${position}`;
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
