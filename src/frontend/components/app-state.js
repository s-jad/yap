const state = new Map();

function updateState(key, value) {
  state.set(key, value);
}

function getState(key) {
  return state.get(key);
}

export {
  updateState,
  getState,
}
