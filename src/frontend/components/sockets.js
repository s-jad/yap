import { io } from "socket.io-client";

let initialized = false;
let socket;

function disconnectSocket() {
  initialized = false;
  if (socket !== null) {
    socket.emit('user disconnect');
    socket = null;
  }
}

function initialiseSocket() {
  console.log("Calling initialiseSocket!!");
  socket = io(process.env.SERVER_URL);
  initialized = true;
  window.addEventListener('beforeunload', () => {
    disconnectSocket();
  });
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
