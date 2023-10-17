import '../styles/inbox.css';
import { getAppState } from "./app-state";
import { getInboxMessages } from "./tribes-db-access";

async function populateInboxOutbox(inbox, outbox) {
  const messages = await getInboxMessages();

  messages.forEach((msg) => {

    const msgEl = document.createElement('div');
    msgEl.className = 'user-message-wrapper';
    msgEl.innerHTML = `
      <p class="user-message-timestamp">${msg.message_timestamp}</p>
      <p class="user-message-sent" style="color: hsl(${msg.sender_color}, 100%, 70%)">${msg.sender_name}</p>
      <p class="user-message-content">${msg.message_content}</p>
    `;

    if (msg.sender_name === getAppState('username')) {
      outbox.appendChild(msgEl);
    } else if (msg.receiver_name === getAppState('username')) {
      inbox.appendChild(msgEl);
    } else {
      console.error("populateInbox receiving messages it shouldnt");
    }
  });

}

export default async function MessagesDashboard() {
  const userMessagesContainer = document.createElement('div');
  userMessagesContainer.className = 'user-messages-container removable';
  userMessagesContainer.id = 'user-messages';

  userMessagesContainer.innerHTML = `
    <div class="user-messages-sidebar">
      <ul class="options-list">
        <a class="options-list-link"><li class="options-list-item">Inbox</li></a>
        <a class="options-list-link"><li class="options-list-item">Outbox</li></a>
        <a class="options-list-link"><li class="options-list-item">Report Spam</li></a>
      </ul>
    </div>
    <div class="inbox-messages-outer">
      <div class="messages-scroll-wrapper">
        <div class="inbox-messages-inner">
          
        </div> 
      </div>
    </div>

    <div class="outbox-messages-outer hide">
      <div class="messages-scroll-wrapper">
        <div class="outbox-messages-inner">
          
        </div> 
      </div>
    </div>
  `;

  const inboxMessagesInner = userMessagesContainer.querySelector('.inbox-messages-inner');
  const outboxMessagesInner = userMessagesContainer.querySelector('.outbox-messages-inner');
  
  await populateInboxOutbox(inboxMessagesInner, outboxMessagesInner);

  return userMessagesContainer;
}
