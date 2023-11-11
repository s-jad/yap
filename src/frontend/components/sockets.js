import { io } from "socket.io-client";
import { getAppState } from "./app-state";

let chatroomSocketInitialized = false;
let inboxSocketInitialized = false;
let chatroomSocket;
let inboxSocket;

function disconnectSocket(namespace) {
  if (chatroomSocket !== null && namespace === '/tribe-chat') {
    chatroomSocketInitialized = false;
    const chatroom = getAppState('current-room');
    chatroomSocket.emit('user disconnect', chatroom);
    chatroomSocket = null;
  } else if (inboxSocket !== null && namespace === '/inbox') {
    inboxSocketInitialized = false;
    inboxSocket.emit('user disconnect', chatroom);
    inboxSocket = null;
  }
}

function initialiseSocket(namespace) {
  if (namespace === '/tribe-chat') {
    chatroomSocket = io(`${process.env.SERVER_URL}${namespace}`);
    chatroomSocketInitialized = true;
  } else if (namespace === '/inbox') {
    inboxSocket = io(`${process.env.SERVER_URL}${namespace}`);
    inboxSocketInitialized = true;
  }
  window.addEventListener('beforeunload', () => {
    if (chatroomSocketInitialized && inboxSocketInitialized) {
      disconnectSocket('/inbox');
      disconnectSocket('/tribe-chat');
    } else {
      disconnectSocket(namespace);
    }
  });
}

function getSocketInitState(namespace) {
  if (namespace === '/tribe-chat') {
    return chatroomSocketInitialized;
  } else if (namespace === '/inbox') {
    return inboxSocketInitialized;
  }
}

export {
  chatroomSocket,
  inboxSocket,
  getSocketInitState,
  disconnectSocket,
  initialiseSocket,
};
