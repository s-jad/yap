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
    inboxSocket.emit('user disconnect');
    inboxSocket = null;
  }
}

function initialiseSocket(namespace) {
  window.addEventListener('beforeunload', () => {
    if (chatroomSocketInitialized && inboxSocketInitialized) {
      disconnectSocket('/inbox');
      disconnectSocket('/tribe-chat');
    } else {
      disconnectSocket(namespace);
    }
  });

  if (namespace === '/tribe-chat') {
    chatroomSocket = io(`${process.env.SERVER_URL}${namespace}`, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax : 5000,
      reconnectionAttempts: 20,
    });

    chatroomSocket.on('connect_error', function () {
      chatroomSocket.io.readyState = 'closed'; 
      chatroomSocket.io.reconnect();
    });

    chatroomSocketInitialized = true;

    return chatroomSocket;
  } else if (namespace === '/inbox') {
    inboxSocket = io(`${process.env.SERVER_URL}${namespace}`, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax : 5000,
      reconnectionAttempts: 20,
    });

    inboxSocket.on('connect_error', function () {
      inboxSocket.io.readyState = 'closed';
      inboxSocket.io.reconnect();
    });

    inboxSocketInitialized = true;

    return inboxSocket;
  }
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
