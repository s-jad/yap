import { io } from "socket.io-client";
import { getAppState } from "./app-state";

let chatroomSocketInitialized = false;
let notificationsSocketInitialized = false;
let chatroomSocket;
let notificationsSocket;

function disconnectSocket(namespace) {
  if (chatroomSocket !== null && namespace === '/tribe-chat') {
    chatroomSocketInitialized = false;
    const chatroom = getAppState('current-room');
    chatroomSocket.emit('user disconnect', chatroom);
    chatroomSocket = null;
  } else if (notificationsSocket !== null && namespace === '/notifications') {
    notificationsSocketInitialized = false;
    notificationsSocket.emit('user disconnect');
    notificationsSocket = null;
  }
}

function initialiseSocket(namespace) {
  window.addEventListener('beforeunload', () => {
    if (chatroomSocketInitialized && notificationsSocketInitialized) {
      disconnectSocket('/notifications');
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

    chatroomSocket.on('connection error', function () {
      chatroomSocket.io.readyState = 'closed'; 
      chatroomSocket.io.reconnect();
    });

    chatroomSocketInitialized = true;

    return chatroomSocket;
  } else if (namespace === '/notifications') {
    notificationsSocket = io(`${process.env.SERVER_URL}${namespace}`, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax : 5000,
      reconnectionAttempts: 20,
    });

    notificationsSocket.on('connection error', function () {
      showDialog(
        document.body,
        'An error has occured connecting to the notifications system, retrying in 1second',
        'notifcations-socket-connection-failure',
        'fail',
        'top-right',
      );
      notificationsSocket.io.readyState = 'closed';
      notificationsSocket.io.reconnect();
    });

    notificationsSocketInitialized = true;

    return notificationsSocket;
  }
}

function getSocketInitState(namespace) {
  if (namespace === '/tribe-chat') {
    return chatroomSocketInitialized;
  } else if (namespace === '/inbox') {
    return notificationsSocketInitialized;
  }
}

export {
  chatroomSocket,
  notificationsSocket,
  getSocketInitState,
  disconnectSocket,
  initialiseSocket,
};
