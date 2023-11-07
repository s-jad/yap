import '../styles/general-chatroom-styling.css';
import { getAppState, showDialog, updateAppState } from './app-state';
import { getMessages } from './tribes-db-access';
import { socket } from './sockets';

const activeMembers = [];

const chatState = {
  replying: false,
  tribeName: '',
}

const messageState = {
  receiver: 'global',
  global: true,
  replyTo: '',
};

function getMemberState(username, memberHue) {
  let color;
  if (!memberHue) {
    color = Math.floor(Math.random() * 360);
  } else {
    color = memberHue;
  }
  return {
    username,
    color,
  }
}

function createNewMessage(msg) {
  if (msg === undefined) {
    return;
  }

  const { sender_name, receiver_name, message_content } = msg;

  const newMessage = document.createElement('div');
  newMessage.setAttribute('data-sender', sender_name);

  const timestamp = new Date().toISOString();
  const timeText = timestamp.slice(timestamp.indexOf('T') + 1, timestamp.indexOf('.'))
  newMessage.className = `message-wrapper message-${timestamp}`;

  if (receiver_name === sender_name) {
    newMessage.setAttribute('data-receiver', 'global');
    newMessage.innerHTML = `
      <p class="msg-sender">${sender_name}:</p>
      <p class="user-message">${message_content}</p>
    `;
  } else {
    newMessage.setAttribute('data-receiver', receiver_name);
    newMessage.innerHTML = `
      <p class="msg-sender">${sender_name}:</p>
      <p class="user-replying-to">@${receiver_name}</p>
      <p class="user-message">${message_content}</p>

    `;
    const msgReceiverEl = newMessage.querySelector('.user-replying-to');
    const receiver = activeMembers.find(member => member.username === receiver_name);
    msgReceiverEl.style.color = `hsl(${receiver.color}, 100%, 70%)`;
  }

  const sender = activeMembers.find(member => member.username === sender_name);
  const msgSenderEl = newMessage.querySelector('.msg-sender');
  msgSenderEl.style.color = `hsl(${sender.color}, 100%, 70%)`;

  const timeStampEl = document.createElement('div');
  timeStampEl.className = 'timestamp-wrapper';
  timeStampEl.innerHTML = `<p class="timestamp time-${timestamp}">${timeText}</p>`;

  newMessage.addEventListener('click', (ev) => {
    if (chatState.replying
      && messageState.replyTo !== newMessage.classList.item(1)
    ) {
      return;
    }

    if (newMessage.classList.contains('replying-to')) {
      newMessage.classList.remove('replying-to');
      messageState.global = true;
      messageState.receiver = 'global';
      messageState.replyTo = newMessage.classList.item(1);
      chatState.replying = false;
    } else {
      newMessage.classList.add('replying-to');
      messageState.global = false;
      messageState.receiver = ev.target.getAttribute('data-sender');
      messageState.replyTo = '';
      chatState.replying = true;
    }
  });

  return {
    newMessage,
    timeStampEl,
  };
}

function createDbMessage(msg) {
  const newMessage = document.createElement('div');
  const timestamp = msg.message_timestamp;

  newMessage.setAttribute('data-sender', msg.sender_name);
  if (msg.sender_name === msg.receiver_name) {
    newMessage.setAttribute('data-receiver', 'global');
    newMessage.innerHTML = `
      <p class="msg-sender">${msg.sender_name}:</p>
      <p class="user-message">${msg.message_content}</p>
    `;
  } else {
    newMessage.setAttribute('data-receiver', msg.receiver_name);
    newMessage.innerHTML = `
      <p class="msg-sender">${msg.sender_name}:</p>
      <p class="user-replying-to">@${msg.receiver_name}</p>
      <p class="user-message">${msg.message_content}</p>
    `;

    const receiverInfo = activeMembers.find(member => member.username === msg.receiver_name);
    const msgReceiver = newMessage.querySelector('.user-replying-to');
    msgReceiver.style.color = `hsl(${receiverInfo.color}, 100%, 70%)`;
  }
  newMessage.className = `message-wrapper message-${timestamp}`;

  const senderInfo = activeMembers.find(member => member.username === msg.sender_name);
  const msgSender = newMessage.querySelector('.msg-sender');
  msgSender.style.color = `hsl(${senderInfo.color}, 100%, 70%)`;

  const timeText = timestamp.slice(timestamp.indexOf('T') + 1, timestamp.indexOf('.'))

  const timeStampEl = document.createElement('div');
  timeStampEl.className = 'timestamp-wrapper';
  timeStampEl.innerHTML = `<p class="timestamp time-${timestamp}">${timeText}</p>`;

  newMessage.addEventListener('click', (ev) => {
    const sendMessageInput = document.body.querySelector('.send-message-input');
    sendMessageInput.value = '';
    messageState.global = false;
    messageState.receiver = ev.currentTarget.getAttribute('data-sender');
    messageState.replyTo = newMessage.classList.item(1);
    chatState.replying = true;
    const msgSenderTxt = newMessage.querySelector('.msg-sender').textContent;
    const msgSender = msgSenderTxt.slice(0, msgSenderTxt.lastIndexOf(':'));
    sendMessageInput.value = `@${msgSender} `;
    sendMessageInput.focus();
  });

  return {
    newMessage,
    timeStampEl,
  };
}

function handleDbReturn(messages, msgView, msgTimeline) {
  messages.forEach((msg) => {
    if (!activeMembers.some((member) => member.username === msg.sender_name)) {
      activeMembers.push(getMemberState(msg.sender_name, msg.sender_color));
    }
    if (!activeMembers.some((member) => member.username === msg.receiver_name)) {
      activeMembers.push(getMemberState(msg.receiver_name, msg.receiver_color));
    }
    const { newMessage, timeStampEl } = createDbMessage(msg);
    msgView.appendChild(newMessage);
    msgTimeline.appendChild(timeStampEl);
  });
}

async function populateWithMessages(msgView, msgTimeline) {
  const tribeName = chatState.tribeName;
  const messages = await getMessages(tribeName);
  handleDbReturn(messages, msgView, msgTimeline);
}

function checkForAtInInput(message) {
  if (message.includes('@')) {
    const receiver = message.slice(message.indexOf('@') + 1, message.indexOf(' '));
    messageState.global = false;
    messageState.receiver = receiver;
    return true;
  }

  return false;
}

function handleUserInput(msg) {
  const timestamp = new Date().toISOString();
  const atInMsg = checkForAtInInput(msg);
  let editedMsg;

  if (atInMsg) {
    editedMsg = msg.slice(msg.indexOf(' ') + 1, msg.length);
  } else {
    editedMsg = msg
  }

  return { editedMsg, timestamp };
}

function handleMsgReceive(msg) {
  const messageView = document.querySelector('.message-view');
  const messageTimeline = document.querySelector('.message-timeline');

  const { newMessage, timeStampEl } = createNewMessage(msg);
  messageView.appendChild(newMessage);
  messageTimeline.appendChild(timeStampEl);
}

async function handleMsgPost(msg) {
  const tribeName = chatState.tribeName;
  const { editedMsg, timestamp } = handleUserInput(msg);
  const global = messageState.global;

  if (global === false) {
    socket.emit('message', {
      tribe_name: tribeName,
      receiver_name: messageState.receiver,
      message_content: editedMsg,
      message_timestamp: timestamp,
      global,
    });

    messageState.receiver = 'global';
    messageState.replyTo = '';
    chatState.replying = false;
    messageState.global = true;
  } else {
    socket.emit('message', {
      tribe_name: tribeName,
      receiver_name: null,
      message_content: editedMsg,
      message_timestamp: timestamp,
      global,
    });
  }
}

// async function handleUpdateLogin() {
//   console.log("WE SHOULDNT BE HERE!!!!!!");
//   const newLogin = new Date().toISOString();
//   await updateTribeMemberLogin(newLogin, chatState.tribeName);
// }

export default async function TribeChat(tribe) {
  chatState.tribeName = tribe
    .replace(/-([a-z])/g, function(g) { return ' ' + g[1].toUpperCase(); })
    .replace(/\/([a-z])/g, function(g) { return '' + g[1].toUpperCase(); });

  updateAppState('current-room', chatState.tribeName);

  const tribeChatContainer = document.createElement('div');
  tribeChatContainer.id = 'tribe-chat-container';
  tribeChatContainer.className = 'chat-container removable';

  tribeChatContainer.innerHTML = `
    <div class="messages-container-outer">
      <div class="messages-scroll-wrapper">
        <h1 class="chatroom-title">${chatState.tribeName}</h1>
        <div class="messages-container-inner">
          <div class="message-timeline"></div>
          <div class="message-view"></div>
        </div>
      </div>
      <footer class="send-message-footer">
        <div class="send-message-wrapper">
          <input type="text" class="send-message-input" maxLength="300" placeholder="Your message..."/>
          <button class="send-message-btn">Send</button>
        </div>
      </footer>
    </div>
  `;

  const messageInput = tribeChatContainer.querySelector('.send-message-input');
  const messageBtn = tribeChatContainer.querySelector('.send-message-btn');
  const messagesScrollWrapper = tribeChatContainer.querySelector('.messages-scroll-wrapper');
  const msgView = tribeChatContainer.querySelector('.message-view');
  const msgTimeline = tribeChatContainer.querySelector('.message-timeline');

  if (!activeMembers.some((member) => member.username === getAppState('username'))) {
    activeMembers.push(getMemberState(getAppState('username'), parseInt(getAppState('userColor'), 10)));
  }

  await populateWithMessages(msgView, msgTimeline);

  //handleUpdateLogin();

  messageInput.addEventListener('keypress', (ev) => {
    if (ev.key === 'Enter') {
      handleMsgPost(messageInput.value);
    }
  });

  messageBtn.addEventListener('click', () => {
    handleMsgPost(messageInput.value);
  });

  socket.on('connection', (data) => {
    console.log(data.message);
  });

  socket.on('message', (data) => {
    try {
      const parsedData = JSON.parse(data);
      handleMsgReceive(parsedData);

      messageInput.value = '';
      messageInput.focus();
      messagesScrollWrapper.scrollTop = messagesScrollWrapper.scrollHeight;
    } catch (error) {
      showDialog(
        tribeChatContainer,
        `Something went wrong, please check the @username you input exists`,
        'message-error',
        'fail'
      );
    }
  });

  messageInput.value = '';
  messageInput.focus();
  messagesScrollWrapper.scrollTop = messagesScrollWrapper.scrollHeight;

  tribeChatContainer.addEventListener('focus-tribe-chat-members', (ev) => {
    messageInput.value = `@${ev.detail.focus.replyTo} `;
    messageInput.focus();
  });

  return tribeChatContainer;
}

