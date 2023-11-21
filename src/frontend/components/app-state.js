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

const notificationsArr = [];

function getUserMessages() {
  const userMsgJson = sessionStorage.getItem('user-messages');
  let msgs = JSON.parse(userMsgJson);

  const newMsgsJson = sessionStorage.getItem('new-user-messages');
  if (newMsgsJson) {
    const newMsgs = JSON.parse(newMsgsJson);
    msgs = [...newMsgs, ...msgs];
  }

  return msgs;
}

function storeUserMessages(msgs) {
  const msgString = JSON.stringify(msgs);
  sessionStorage.setItem('user-messages', msgString);
}

function updateUserMessages(msg) {
  const newMsgsJson = sessionStorage.getItem('new-user-messages');
  
  if (newMsgsJson) {
    const prevMsgs = JSON.parse(newMsgsJson);
    prevMsgs.push(msg);
    const newMsgsString = JSON.stringify(prevMsgs);
    sessionStorage.setItem('new-user-messages', newMsgsString);
  } else {
    const msgString = JSON.stringify([msg]);
    sessionStorage.setItem('new-user-messages', msgString);
  }
}

function clearNewMessages() {
  sessionStorage.removeItem('new-user-messages');
}

export {
  updateAppState,
  getAppState,
  showDialog,
  notificationsArr,
  getUserMessages,
  storeUserMessages,
  updateUserMessages,
  clearNewMessages,
}
