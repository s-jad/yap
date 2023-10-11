import '../styles/general-chatroom-styling.css';
import { getAppState } from './app-state';
import { getMessages } from './tribes-db-access';

const memberState = {
  replying: false,
}

const messageState = {
  receiver: 'global',
  global: true,
  replyTo: '',
};

function createNewMessage(message) {
  if (message === "") {
    return;
  }
  const newMessage = document.createElement('div');
  newMessage.setAttribute('data-sender', getAppState('username'));

  const timestamp = new Date().toISOString();
  const timeText = timestamp.slice(timestamp.indexOf('T') + 1, timestamp.indexOf('.'))
  newMessage.className = `message-wrapper message-${timestamp}`;

  if (messageState.receiver !== '') {
    newMessage.setAttribute('data-receiver', 'global');
    newMessage.innerHTML = `
      <img src="" alt="Icon" class="user-icon"/>
      <p class="user-message">${message}</p>
    `;
  } else {
    newMessage.setAttribute('data-receiver', messageState.receiver);
    newMessage.innerHTML = `
      <img src="" alt="Icon" class="user-icon"/>
      <p class="user-replying-to">@${messageState.receiver}</p>
      <p class="user-message">${message}</p>
    `;
  }

  const timeStampEl = document.createElement('div');
  timeStampEl.className = 'timestamp-wrapper';
  timeStampEl.innerHTML = `<p class="timestamp time-${timestamp}">${timeText}</p>`;

  newMessage.addEventListener('click', (ev) => {
    // If the user has already clicked a message to reply to 
    // and the message being clicked is NOT the one that was already clicked
    if (memberState.replying 
      && messageState.replyTo !== newMessage.classList.item(1)
    ) {
      return;
    }

    if (newMessage.classList.contains('replying-to')) {
      newMessage.classList.remove('replying-to');
      messageState.global = true;
      messageState.receiver = '';
      messageState.replyTo = newMessage.classList.item(1);
      memberState.replying = false;
    } else {
      newMessage.classList.add('replying-to');
      messageState.global = false;
      messageState.receiver = ev.target.getAttribute('data-sender');
      messageState.replyTo = '';
      memberState.replying = true;
    }
  });

  return {
    newMessage,
    timeStampEl,
    timestamp
  };
}

function handleUserInput(message) {
  const messageView = document.querySelector('.message-view');
  const messageTimeline = document.querySelector('.message-timeline');

  const { newMessage, timeStampEl, timestamp } = createNewMessage(message);
  messageView.appendChild(newMessage);
  messageTimeline.appendChild(timeStampEl);

  return timestamp;
}

function createDbMessage(msg) {
  const newMessage = document.createElement('div');
  const timestamp = msg.message_timestamp;

  newMessage.setAttribute('data-sender', msg.sender_name);
  if (msg.sender_name === msg.receiver_name) {
    newMessage.setAttribute('data-receiver', 'global');
    newMessage.innerHTML = `
      <img src="" alt="Icon" class="user-icon"/>
      <p class="user-message">${msg.message_content}</p>
    `;
  } else {
    newMessage.setAttribute('data-receiver', msg.receiver_name);
    newMessage.innerHTML = `
      <img src="" alt="Icon" class="user-icon"/>
      <p class="user-replying-to">@${msg.receiver_name}</p>
      <p class="user-message">${msg.message_content}</p>
    `;

  }
  newMessage.className = `message-wrapper message-${timestamp}`;

  const timeText = timestamp.slice(timestamp.indexOf('T') + 1, timestamp.indexOf('.'))

  const timeStampEl = document.createElement('div');
  timeStampEl.className = 'timestamp-wrapper';
  timeStampEl.innerHTML = `<p class="timestamp time-${timestamp}">${timeText}</p>`;

  newMessage.addEventListener('click', (ev) => {
    // If the user has already clicked a message to reply to 
    // and the message being clicked is NOT the one that was already clicked
    if (memberState.replying 
      && messageState.replyTo !== newMessage.classList.item(1)
    ) {
      return;
    }

    if (newMessage.classList.contains('replying-to')) {
      newMessage.classList.remove('replying-to');
      messageState.global = true;
      messageState.receiver = '';
      messageState.replyTo = '';
      memberState.replying = false;
    } else {
      newMessage.classList.add('replying-to');
      messageState.global = false;
      messageState.receiver = ev.target.getAttribute('data-sender');
      messageState.replyTo = newMessage.classList.item(1);
      memberState.replying = true;
    }
  });

  return {
    newMessage,
    timeStampEl,
  };
}

function handleDbReturn(messages, msgView, msgTimeline) {
  messages.forEach((msg) => {
    const { newMessage, timeStampEl } = createDbMessage(msg);
    msgView.appendChild(newMessage);
    msgTimeline.appendChild(timeStampEl);
  });
}

async function populateWithMessages(tribeName, msgView, msgTimeline) {
  const messages = await getMessages(tribeName);
  handleDbReturn(messages, msgView, msgTimeline);
}


function handleDbPost(message, timestamp) {
  console.log(message);
}

export default async function TribeChat(tribeName) {
  const tribeChatContainer = document.createElement('div');
  tribeChatContainer.id = 'tribe-chat-container';
  tribeChatContainer.className = 'chat-container removable';

  tribeChatContainer.innerHTML = `
    <div class="messages-container-outer">
      <h1 class="chatroom-title">${tribeName}</h1>
      <div class="messages-scroll-wrapper">
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

  await populateWithMessages(tribeName, msgView, msgTimeline);

  messageInput.addEventListener('keypress', (ev) => {
    if (ev.key === 'Enter') {
      const timestamp = handleUserInput(messageInput.value);
      const replyToMsg = tribeChatContainer.querySelector('.replying-to');

      if (replyToMsg) {
        replyToMsg.classList.remove('replying-to');
        messageState.receiver = '';
        messageState.global = true;
        messageState.replyTo = '';
        memberState.replying = false;
      }

      const user = getAppState('username');
      handleDbPost(messageInput.value, timestamp);

      messageInput.value = '';
      messageInput.focus();
      messagesScrollWrapper.scrollTop = messagesScrollWrapper.scrollHeight;
    }
  });

  messageBtn.addEventListener('click', () => {
    const timestamp = handleUserInput(messageInput.value);
    const replyToMsg = tribeChatContainer.querySelector('.replying-to');
    
    if (replyToMsg) {
      replyToMsg.classList.remove('replying-to');
      messageState.receiver = '';
      messageState.global = true;
      messageState.replyTo = '';
      memberState.replying = false;
    }

    handleDbPost(messageInput.value, timestamp);

    messagesScrollWrapper.scrollTop = messagesScrollWrapper.scrollHeight;
    messageInput.focus();
    messageInput.value = '';
  });

  return tribeChatContainer;
}
