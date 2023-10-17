import '../styles/inbox.css';
import { getAppState } from "./app-state";
import { getInboxMessages } from "./tribes-db-access";

const messagesDashboardComponents = [];
const userMessages = [];

async function fetchUserMessages() {
  const messages = await getInboxMessages();
  messages.forEach((msg) => {
      userMessages.push(msg);
  });
  console.log("userMsgs => ", userMessages);
  return messages;
}

function getReplies(parentMsgId) {
  const replyChain = [];

  let currentMsgId = parentMsgId;
  let currentMsg;
  while(currentMsgId !== null) {
    console.log("currentMsgId => ", currentMsgId);
    currentMsg = userMessages.find((msg) => msg.message_id === currentMsgId);
    console.log("currentMsg => ", currentMsg);
    currentMsgId = currentMsg.parent_message_id;
    
    replyChain.push(currentMsg);
  }

  return replyChain.reverse();
}




async function populateInboxOutbox(inbox, outbox) {
  const messages = await fetchUserMessages();
  const currentUser = getAppState('username');

  const populateReplyChains = (msg, msgEl, ev) => {
    if (ev.currentTarget.classList.contains('expanded')) {
      msgEl.classList.remove('expanded');
      const displayedReplyChain = msgEl.querySelector('.reply-chain-container');
      msgEl.removeChild(displayedReplyChain);
    } else {
      msgEl.classList.add('expanded');
      
      const replyChainContainer = document.createElement('div');
      replyChainContainer.className = 'reply-chain-container';

      if (msg.parent_message_id !== null) {
        console.log("msg => ", msg);
        const replyTo = document.createElement('p');
        replyTo.className = 'replying-to';
        replyTo.textConten = 'Replying to:';
        msgEl.appendChild(replyTo);
        const parentMsgs = getReplies(msg.parent_message_id);
        
        parentMsgs.forEach((parentMsg) => {
          const parentMsgEl = document.createElement('div');
          parentMsgEl.className = 'reply-message-wrapper';
          parentMsgEl.innerHTML = `
              <p class="reply-message-sender" 
            style="color: hsl(${parentMsg.sender_color}, 100%, 70%)">${parentMsg.sender_name}</p>
              <p class="reply-message-content">${parentMsg.message_content}</p>
              <p class="reply-message-timestamp">${parentMsg.message_timestamp}</p>
          `;

          replyChainContainer.appendChild(parentMsgEl);
        });
      }
      msgEl.appendChild(replyChainContainer);
    }
  }

  messages.forEach((msg) => {
    const fullMsgDate = new Date(msg.message_timestamp).toString();
    const dateParts = fullMsgDate.split(' ');
    const displayMsgDate = `${dateParts[2]} ${dateParts[1]} ${dateParts[3]}`;
    const msgTime = dateParts[4];

    const msgEl = document.createElement('div');
    msgEl.className = 'user-message-wrapper';
    
    msgEl.addEventListener('click', (ev) => {
      populateReplyChains(msg, msgEl, ev);
    });

    if (msg.sender_name === currentUser) {
      msgEl.innerHTML = `
        <p class="user-message-receiver" style="color: hsl(${msg.receiver_color}, 100%, 70%)">${msg.receiver_name}</p>
        <p class="user-message-content">${msg.message_content}</p>
        <p class="user-message-timestamp">${displayMsgDate}</p>
      `;
      outbox.appendChild(msgEl);
    } else if (msg.receiver_name === currentUser) {
      msgEl.innerHTML = `
        <p class="user-message-sender" style="color: hsl(${msg.sender_color}, 100%, 70%)">${msg.sender_name}</p>
        <p class="user-message-content">${msg.message_content}</p>
        <p class="user-message-timestamp">${displayMsgDate}</p>
      `;
      inbox.appendChild(msgEl);
    } else {
      console.error("populateInbox receiving messages it shouldnt");
    }
  });

}

function getInbox() {
  const inboxOuter = document.createElement('div');
  inboxOuter.className = 'inbox-messages-outer messages-component-outer';
  inboxOuter.innerHTML = `
    <div class="messages-scroll-wrapper">
      <div class="inbox-messages-inner">
        
      </div> 
    </div>
  `;

  return inboxOuter;
}

function getOutbox() {
  const outboxOuter = document.createElement('div');
  outboxOuter.className = 'outbox-messages-outer messages-component-outer';
  outboxOuter.innerHTML = `
    <div class="messages-scroll-wrapper">
      <div class="outbox-messages-inner">
        
      </div> 
    </div>
  `;

  return outboxOuter;
}

function getReportSpam() {
  const reportSpam = document.createElement('div');
  reportSpam.className = 'report-messages-outer messages-component-outer';
  reportSpam.innerHTML = `
    <div class="messages-scroll-wrapper">
      <div class="report-messages-inner">
        
      </div> 
    </div>
  `;

  return reportSpam;
}

function messagesDashboardRouting(linkTo, displayed) {
  const userMessagesContainer = document.body.querySelector('#user-messages');
  userMessagesContainer.removeChild(displayed);

  switch (linkTo) {
    case 'inbox':
      userMessagesContainer.appendChild(messagesDashboardComponents[0]);
      break;

    case 'outbox':
      userMessagesContainer.appendChild(messagesDashboardComponents[1]);
      break;

    case 'report-spam':
      userMessagesContainer.appendChild(messagesDashboardComponents[2]);
      break;
  }
}

export default async function MessagesDashboard() {
  const userMessagesContainer = document.createElement('div');
  userMessagesContainer.className = 'user-messages-container removable';
  userMessagesContainer.id = 'user-messages';

  userMessagesContainer.innerHTML = `
    <div class="user-messages-sidebar">
      <ul class="options-list">
        <li class="options-list-item displayed" data-link="inbox">Inbox</li>
        <li class="options-list-item" data-link="outbox">Outbox</li>
        <li class="options-list-item" data-link="report-spam">Report Spam</li>
      </ul>
    </div>
  `;

  const links = Array.from(userMessagesContainer.querySelectorAll('.options-list-item'));

  links.forEach((link) => {
    link.addEventListener('click', () => {
      const linkTo = link.getAttribute('data-link');
      const currentlyDisplayed = userMessagesContainer.querySelector('.messages-component-outer');
      const prevLink = userMessagesContainer.querySelector('.displayed');
      prevLink.classList.remove('displayed');
      link.classList.add('displayed');
      messagesDashboardRouting(linkTo, currentlyDisplayed);
    });
  });

  const inbox = getInbox();
  const outbox = getOutbox();
  const reportSpam = getReportSpam();

  const inboxMessagesInner = inbox.querySelector('.inbox-messages-inner');
  const outboxMessagesInner = outbox.querySelector('.outbox-messages-inner');
  
  await populateInboxOutbox(inboxMessagesInner, outboxMessagesInner);

  messagesDashboardComponents.push(inbox);
  messagesDashboardComponents.push(outbox);
  messagesDashboardComponents.push(reportSpam);

  userMessagesContainer.appendChild(inbox);

  return userMessagesContainer;
}
