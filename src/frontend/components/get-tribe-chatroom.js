import '../styles/general-chatroom-styling.css';
import { getMessages } from './tribes-db-access';

function createMessage(message, dbTime) {
  if (message === "") {
    return;
  }
  const newMessage = document.createElement('div');
  let time;
  let date;
  
  if (dbTime === undefined) {
    date = new Date().toISOString();
    time = date.slice(date.indexOf('T') + 1, date.indexOf('.'))
  } else {
    date = dbTime;
    time = dbTime.slice(dbTime.indexOf('T') + 1, dbTime.indexOf('.'));
  }

  newMessage.className = `message-wrapper message-${date}`;
  newMessage.innerHTML = `
    <img src="" alt="Icon" class="user-icon"/>
    <p class="user-message">${message}</p>
  `;
  const timeStamp = document.createElement('div');
  timeStamp.className = 'timestamp-wrapper';
  timeStamp.innerHTML = `<p class="timestamp time-${time}">${time}</p>`;

  return {
    newMessage,
    timeStamp,
    date
  };
}

function handleUserInput(message) {
  const messageView = document.querySelector('.message-view');
  const messageTimeline = document.querySelector('.message-timeline');

  const { newMessage, timeStamp, date } = createMessage(message);
  messageView.appendChild(newMessage);
  messageTimeline.appendChild(timeStamp);
}

function handleDbReturn(messages, msgView, msgTimeline) {
  messages.forEach((msg) => {
    const { newMessage, timeStamp, date } = createMessage(msg.message_content, msg.message_timestamp);
    msgView.appendChild(newMessage);
    msgTimeline.appendChild(timeStamp);
  });
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

  const messages = await getMessages(tribeName);
  handleDbReturn(messages, msgView, msgTimeline);

  messageInput.addEventListener('keypress', (ev) => {
    if (ev.key === 'Enter') {
      handleUserInput(messageInput.value);
      messageInput.value = '';
      messageInput.focus();
      messagesScrollWrapper.scrollTop = messagesScrollWrapper.scrollHeight;
    }
  });

  messageBtn.addEventListener('click', () => {
    handleUserInput(messageInput.value);
    messageInput.value = '';
    messageInput.focus();
    messagesScrollWrapper.scrollTop = messagesScrollWrapper.scrollHeight;
  });

  return tribeChatContainer;
}
