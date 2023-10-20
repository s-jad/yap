import '../styles/general-chatroom-styling.css';
import { getAppState } from './app-state';
import { getMessages, postChatMessage } from './tribes-db-access';

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

function createNewMessage(message) {
  if (message === "") {
    return;
  }
  

  const newMessage = document.createElement('div');
  newMessage.setAttribute('data-sender', getAppState('username'));

  const timestamp = new Date().toISOString();
  const timeText = timestamp.slice(timestamp.indexOf('T') + 1, timestamp.indexOf('.'))
  newMessage.className = `message-wrapper message-${timestamp}`;

  if (messageState.receiver === 'global') {
    newMessage.setAttribute('data-receiver', 'global');
    newMessage.innerHTML = `
      <p class="msg-sender">${getAppState('username')}:</p>
      <p class="user-message">${message}</p>
    `;
  } else {
    newMessage.setAttribute('data-receiver', messageState.receiver);
    newMessage.innerHTML = `
      <p class="msg-sender">${getAppState('username')}:</p>
      <p class="user-replying-to">@${messageState.receiver}</p>
      <p class="user-message">${message}</p>

    `;
    const msgReceiverEl = newMessage.querySelector('.user-replying-to');
    const receiver = activeMembers.find(member => member.username === messageState.receiver);
    msgReceiverEl.style.color = `hsl(${receiver.color}, 100%, 70%)`;
  }
  
  const msgSenderEl = newMessage.querySelector('.msg-sender');
  msgSenderEl.style.color = `hsl(${getAppState('userColor')}, 100%, 70%)`;

  const timeStampEl = document.createElement('div');
  timeStampEl.className = 'timestamp-wrapper';
  timeStampEl.innerHTML = `<p class="timestamp time-${timestamp}">${timeText}</p>`;

  newMessage.addEventListener('click', (ev) => {
    // If the user has already clicked a message to reply to 
    // and the message being clicked is NOT the one that was already clicked
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
    timestamp
  };
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

function handleUserInput(message) {
  const messageView = document.querySelector('.message-view');
  const messageTimeline = document.querySelector('.message-timeline');

  const atInMsg = checkForAtInInput(message);
  let editedMsg; 
  if (atInMsg) {
    editedMsg = message.slice(message.indexOf(' ') + 1, message.length)
  } else {
    editedMsg = message
  }
  const { newMessage, timeStampEl, timestamp } = createNewMessage(editedMsg);
  messageView.appendChild(newMessage);
  messageTimeline.appendChild(timeStampEl);

  return { editedMsg, timestamp };
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
    // If the user has already clicked a message to reply to 
    // and the message being clicked is NOT the one that was already clicked
    if (chatState.replying 
      && messageState.replyTo !== newMessage.classList.item(1)
    ) {
      return;
    }

    if (newMessage.classList.contains('replying-to')) {
      newMessage.classList.remove('replying-to');
      messageState.global = true;
      messageState.receiver = '';
      messageState.replyTo = '';
      chatState.replying = false;
    } else {
      newMessage.classList.add('replying-to');
      messageState.global = false;
      messageState.receiver = ev.currentTarget.getAttribute('data-sender');
      messageState.replyTo = newMessage.classList.item(1);
      chatState.replying = true;
    }
  });

  return {
    newMessage,
    timeStampEl,
  };
}

function handleDbReturn(messages, msgView, msgTimeline) {
  messages.forEach((msg) => {
    if (!activeMembers.includes(msg.sender_name)) {
      activeMembers.push(getMemberState(msg.sender_name, msg.sender_color));
    }
    if (!activeMembers.includes(msg.receiver_name)) {
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

function handleMessagePost(message) {
  const tribeChatContainer = document.getElementById('tribe-chat-container');
  const tribeName = chatState.tribeName;
  const { editedMsg, timestamp } = handleUserInput(message);
  const replyToMsg = tribeChatContainer.querySelector('.replying-to');
  const userId = getAppState('userId');
  
  if (messageState.global === false) {
    postChatMessage(
      tribeName,
      editedMsg,
      userId,
      messageState.receiver,
      timestamp,
      messageState.global
    );

    if (replyToMsg !== null) {
      replyToMsg.classList.remove('replying-to');
    }

    messageState.receiver = 'global';
    messageState.replyTo = '';
    chatState.replying = false;
    messageState.global = true;
  } else {
    postChatMessage(
      tribeName,
      editedMsg,
      userId,
      userId,
      timestamp,
      messageState.global
    );
  }
}

export default async function TribeChat(tribe) {
  chatState.tribeName = tribe
    .replace(/-([a-z])/g, function(g) { return ' ' + g[1].toUpperCase(); })
    .replace(/\/([a-z])/g, function(g) { return '' + g[1].toUpperCase(); });

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

  const memberPresent = activeMembers.includes(member => member.username === getAppState('username'));

  if (!memberPresent) {
    activeMembers.push(getMemberState(getAppState('username'), getAppState('userColor')));
  }

  await populateWithMessages(msgView, msgTimeline);

  messageInput.addEventListener('keypress', (ev) => {
    if (ev.key === 'Enter') {
      handleMessagePost(messageInput.value);

      messageInput.value = '';
      messageInput.focus();
      messagesScrollWrapper.scrollTop = messagesScrollWrapper.scrollHeight;
    }
  });

  messageBtn.addEventListener('click', () => {
    handleMessagePost(messageInput.value);

    messageInput.value = '';
    messageInput.focus();
    messagesScrollWrapper.scrollTop = messagesScrollWrapper.scrollHeight;
  });

  return tribeChatContainer;
}
