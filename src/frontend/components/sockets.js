import { io } from "socket.io-client";

let initialized = false;
let socket;

function initialiseSocket() {
  socket = io(process.env.SERVER_URL);
  initialized = true;
  window.addEventListener('beforeunload', () => {
    socket.emit('disconnect')
  });
}

function disconnectSocket() {
  initialized = false;
  socket.emit('disconnect');
}

function getSocketInitState() {
  return initialized;
}

export {
  socket,
  getSocketInitState,
  disconnectSocket,
  initialiseSocket,
};
