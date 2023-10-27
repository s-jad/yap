import { io } from "socket.io-client";

let initialized = false;
let socket;

function initialiseSocket() {
  console.log("Calling initialiseSocket!!");
  socket = io(process.env.SERVER_URL);
  initialized = true;
  window.addEventListener('beforeunload', () => {
    socket.emit('user disconnect')
  });
}

function disconnectSocket() {
  initialized = false;
  socket.emit('user disconnect');
  socket = null;
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
