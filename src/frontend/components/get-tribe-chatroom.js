function postMessage(message, messageView) {
  if (message === "") {
    return;
  }

  const newMessage = document.createElement('div');
  const timestamp = new Date();
  newMessage.className = `message-${timestamp}`;

  newMessage.innerHTML = `
    <div class="message-wrapper">
      <img src="#" alt="User Icon" class="user-icon"/>
      <p class="user-message">${message}</p>
    </div>
  `;

  messageView.appendChild(newMessage);
}

export default function TribeChat(tribeName) {
  const tribeChatContainer = document.createElement('div');
  tribeChatContainer.id = 'tribe-chat-container';
  tribeChatContainer.className = 'chat-container removable';

  tribeChatContainer.innerHTML = `
    <div class="messages-container-outer">
      <h1 class="chatroom-title">${tribeName}</h1>
      <div class="messages-container-inner">
        <div class="message-timeline"></div>
        <div class="message-view"></div>
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
  const messageView = tribeChatContainer.querySelector('.message-view');

  messageBtn.addEventListener('click', () => {
    postMessage(messageInput.value, messageView);
  });

  return tribeChatContainer;
}
