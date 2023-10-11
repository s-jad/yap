const appState = new Map();

function updateAppState(key, value) {
  appState.set(key, value);
}

function getAppState(key) {
  return appState.get(key);
}

export {
  updateAppState,
  getAppState,
}
