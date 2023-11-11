import '../styles/inbox.css';
import { showDialog, getAppState } from "./app-state";
import {
  deleteInboxMessage,
  replyToInboxMessage,
  getInboxMessages,
  sendInboxMessage
} from "./tribes-db-access";

const messagesDashboardComponents = [];
const userMessagesArr = [];

async function fetchUserMessages() {
  const messages = await getInboxMessages();
  messages.forEach((msg) => {
    userMessagesArr.push(msg);
  });
  console.log("userMsgs => ", userMessagesArr);
  return messages;
}

function getReplies(parentMsgId) {
  const replyChain = [];
  let currentMsgId = parentMsgId;
  let currentMsg;
  while (currentMsgId !== null) {
    currentMsg = userMessagesArr.find((msg) => msg.message_id === currentMsgId);
    currentMsgId = currentMsg.parent_message_id;

    replyChain.push(currentMsg);
  }

  return replyChain;
}

function getReplyIds(parentMsgId) {
  const replyChain = [];

  let currentMsgId = parentMsgId;
  replyChain.push(currentMsgId);
  let currentMsg;

  while (currentMsgId !== null) {
    currentMsg = userMessagesArr.find((msg) => msg.message_id === currentMsgId);
    currentMsgId = currentMsg.parent_message_id;

    if (currentMsgId !== null) {
      replyChain.push(currentMsgId);
    }
  }

  return replyChain;
}

async function deleteMsg(msgId, msgEl) {
  const parent = msgEl.parentNode;
  parent.removeChild(msgEl);

  const result = await deleteInboxMessage(msgId);
  return result;
}

function getReplyView(parentMsg) {
  const replyViewContainer = document.createElement('div');
  replyViewContainer.className = 'reply-view-outer messages-component-outer';
  replyViewContainer.innerHTML = `
    <div class="receiver-info-wrapper">
      <h3 class="replying-to">
        Replying to:&nbsp;
        <span class="msg-receiver" style="color: hsl(${parentMsg.sender_color}, 90%, 50%)">
          ${parentMsg.sender_name}
        </span>
      </h3>
    </div>
    <div class="reply-wrapper">
      <textarea id="reply-text" name="reply-text"></textarea>
      <div class="reply-btn-wrapper">
        <button class="send-reply-btn">Send</button>
        <button class="cancel-reply-btn">Cancel</button>
      </div>
    </div>
  `;

  const replyText = replyViewContainer.querySelector('#reply-text');

  const sendBtn = replyViewContainer.querySelector('.send-reply-btn');
  const userMessagesContainer = document.body.querySelector('#user-messages');
  const inboxLink = userMessagesContainer.querySelector('.options-list-item[data-link="inbox"]');

  sendBtn.addEventListener('click', async () => {
    const replyTxtWithBr = replyText.value.replaceAll('\n', '<br>');
    const result = await replyToInboxMessage(parentMsg.message_id, replyTxtWithBr);

    if (result === true) {
      showDialog(
        userMessagesContainer,
        'Reply sent!',
        'reply-msg-success',
        'success'
      );
      messagesDashboardRouting(inboxLink);
    } else {
      showDialog(
        userMessagesContainer,
        'Something went wrong, please try again later.',
        'inbox-error',
        'fail'
      );
    }
  });

  const cancelBtn = replyViewContainer.querySelector('.cancel-reply-btn');
  cancelBtn.addEventListener('click', () => {
    messagesDashboardRouting(inboxLink);
  });

  return replyViewContainer;
}

async function switchToReplyView(parentMsg) {
  const userMessagesContainer = document.querySelector('.user-messages-container');
  const toRemove = userMessagesContainer.querySelector('.messages-component-outer');
  const replyView = getReplyView(parentMsg);
  userMessagesContainer.removeChild(toRemove);
  userMessagesContainer.appendChild(replyView);
}

function getExpandedMsgBtnContainer(msg, msgEl) {
  const btnContainer = document.createElement('div');
  btnContainer.className = 'expanded-msg-btn-container';
  btnContainer.innerHTML = `
    <button class="expanded-msg-btn reply-btn">Reply</button>
    <button class="expanded-msg-btn delete-btn">Delete</button>
    <button class="expanded-msg-btn report-btn">Report</button>
  `;
  const btns = btnContainer.querySelectorAll('button');

  btns[0].addEventListener('click', async () => {
    switchToReplyView(msg);
  });

  btns[1].addEventListener('click', async () => {
    const userMessagesContainer = document.body.querySelector('.user-messages-container');
    const replyChain = getReplyIds(msg.message_id);
    const result = await deleteMsg(replyChain, msgEl);

    if (result === true) {
      showDialog(
        userMessagesContainer,
        'Message succesfully deleted!',
        'delete-msg-info-success',
        'success'
      );
    } else {
      showDialog(
        userMessagesContainer,
        'Something went wrong, please try again later.',
        'inbox-error',
        'fail'
      );
    }
  });

  return btnContainer;
}

async function populateInboxOutbox(inbox, outbox) {
  let messages;

  if (userMessagesArr.length === 0) {
    messages = await fetchUserMessages();
  } else {
    messages = userMessagesArr;
  }
  const currentUser = getAppState('username');

  const populateReplyChains = (msg, replyChainContainer) => {
    if (msg.parent_message_id !== null) {
      console.log("original msg => ", msg);
      const parentMsgs = getReplies(msg.parent_message_id);

      // TODO - think of better way to ensure db doesnt have
      // two msgs with same parent
      if (parentMsgs === undefined) {
        return;
      }

      const fullMsgDate = new Date(msg.message_timestamp).toString();
      const dateParts = fullMsgDate.split(' ');
      const displayMsgDate = `${dateParts[2]} ${dateParts[1]} ${dateParts[3]}`;

      parentMsgs.forEach((parentMsg) => {
        const parentMsgEl = document.createElement('div');
        parentMsgEl.className = 'reply-message-wrapper';
        parentMsgEl.innerHTML = `
            <p class="reply-message-sender" 
              style="color: hsl(${parentMsg.sender_color}, 100%, 70%)">
              ${parentMsg.sender_name}
            </p>
            <p class="reply-message-content">${parentMsg.message_content}</p>
            <p class="reply-message-timestamp">${displayMsgDate}</p>
        `;

        parentMsgEl.addEventListener('click', (ev) => {
          if (parentMsgEl.classList.contains('expanded')) {
            parentMsgEl.classList.remove('expanded');
          } else {
            parentMsgEl.classList.add('expanded');
          }
        });

        replyChainContainer.appendChild(parentMsgEl);
      });
    }
  }

  messages.forEach((msg) => {
    if (msg.message_read) {
      return;
    }

    const fullMsgDate = new Date(msg.message_timestamp).toString();
    const dateParts = fullMsgDate.split(' ');
    const displayMsgDate = `${dateParts[2]} ${dateParts[1]} ${dateParts[3]}`;
    const msgTime = dateParts[4];

    const msgEl = document.createElement('div');
    msgEl.className = 'user-message-wrapper';
    const replyChainContainer = document.createElement('div');
    replyChainContainer.className = 'reply-chain-container';
    const btnContainer = getExpandedMsgBtnContainer(msg, msgEl);
    btnContainer.className = 'expanded-msg-btn-container';

    msgEl.addEventListener('click', (ev) => {
      if (ev.target.parentNode.parentNode === replyChainContainer) {
        return;
      }

      if (msgEl.classList.contains('expanded')) {
        msgEl.classList.remove('expanded');
        replyChainContainer.style.display = 'none';
        btnContainer.style.display = 'none';
        setTimeout(() => {
          replyChainContainer.style.display = 'flex';
          btnContainer.style.display = 'flex';
        }, 300);
      } else {
        msgEl.classList.add('expanded');
        if (
          replyChainContainer.children.length === 0 &&
          msg.parent_message_id !== null
        ) {
          populateReplyChains(msg, replyChainContainer);
        }
      }
    });

    if (msg.sender_name === currentUser) {
      msgEl.innerHTML = `
        <p class="user-message-receiver">
        To: <span style="color: hsl(${msg.receiver_color}, 100%, 70%)">${msg.receiver_name}</span>
        </p>
        <p class="user-message-content">${msg.message_content}</p>
        
        <p class="user-message-timestamp">${displayMsgDate}</p>
      `;

      msgEl.appendChild(btnContainer);
      msgEl.appendChild(replyChainContainer);
      outbox.appendChild(msgEl);
    } else if (msg.receiver_name === currentUser) {
      msgEl.innerHTML = `
        <p class="user-message-sender" style="color: hsl(${msg.sender_color}, 100%, 70%)">${msg.sender_name}</p>
        <p class="user-message-content">${msg.message_content}</p>
        <p class="user-message-timestamp">${displayMsgDate}</p>
      `;

      msgEl.appendChild(btnContainer);
      msgEl.appendChild(replyChainContainer);
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

function getSendMsg(userMessagesContainer) {
  const sendMsg = document.createElement('div');
  sendMsg.className = 'send-message-outer messages-component-outer';
  sendMsg.innerHTML = `
    <div class="send-message-inner">
      <div class="send-message-receiver-wrapper">
        <h3 class="send-message-receiver">To:</h3>
        <input type="text" class="message-receiver-input"/>
        <h3 class="message-receiver-name hidden"></h3>
      </div>
      <textarea class="send-message-ta"></textarea>
      <button type="button" class="send-message-btn">Send</button>
      <button type="button" class="cancel-message-btn">Cancel</button>
    </div>
  `;

  const sendMsgInput = sendMsg.querySelector('input[type="text"]');
  const msgReceiverName = sendMsg.querySelector('.message-receiver-name');
  const sendMsgTa = sendMsg.querySelector('textarea');

  sendMsgInput.addEventListener('blur', (ev) => {
    msgReceiverName.textContent = sendMsgInput.value;
    msgReceiverName.classList.remove('hidden');
    sendMsgInput.classList.add('hidden');
    sendMsgTa.focus();
  });

  sendMsgInput.addEventListener('keypress', (ev) => {
    if (ev.key === 'Enter') {
      msgReceiverName.textContent = sendMsgInput.value;
      msgReceiverName.classList.remove('hidden');
      sendMsgInput.classList.add('hidden');
      sendMsgTa.focus();
    }
  });

  msgReceiverName.addEventListener('click', () => {
    msgReceiverName.textContent = '';
    msgReceiverName.classList.add('hidden');
    sendMsgInput.classList.remove('hidden');
    sendMsgInput.focus();
  });

  const btns = Array.from(sendMsg.querySelectorAll('button'));
  const inboxLink = userMessagesContainer.querySelector('.options-list-item[data-link="inbox"]');

  btns[0].addEventListener('click', async () => {
    if (
      msgReceiverName.textContent.length > 3
      && sendMsgTa.value !== undefined
    ) {
      const messageWithBr = sendMsgTa.value.replaceAll('\n', '<br>')
      const msgData = {
        receiverName: msgReceiverName.textContent,
        newMsg: messageWithBr,
      };
      const res = await sendInboxMessage(msgData);

      if (res) {
        showDialog(
          userMessagesContainer,
          'Message sent!',
          'msg-sent-success',
          'success',
        );
        messagesDashboardRouting(inboxLink);
      } else {
        showDialog(
          userMessagesContainer,
          'Failed to send message, please check the receivers username',
          'msg-sent-failure',
          'fail'
        );
        msgReceiverName.textContent = '';
        msgReceiverName.classList.add('hidden');
        sendMsgInput.classList.remove('hidden');
        sendMsgInput.focus();
      }
    } else {
      showDialog(
        userMessagesContainer,
        'Please enter a valid member name and/or a message (minimum 3 characters)',
        'msg-sent-failure',
        'fail'
      );
      msgReceiverName.textContent = '';
      msgReceiverName.classList.add('hidden');
      sendMsgInput.classList.remove('hidden');
      sendMsgInput.value = '';
      sendMsgInput.focus();
      return;
    }
  });

  btns[1].addEventListener('click', () => {
    messagesDashboardRouting(inboxLink);
  });

  return sendMsg;
}

function messagesDashboardRouting(link) {
  const userMessagesContainer = document.body.querySelector('#user-messages');
  const linkTo = link.getAttribute('data-link');
  const currentlyDisplayed = userMessagesContainer.querySelector('.messages-component-outer');
  const prevLink = userMessagesContainer.querySelector('.displayed');

  prevLink.classList.remove('displayed');
  link.classList.add('displayed');

  userMessagesContainer.removeChild(currentlyDisplayed);

  switch (linkTo) {
    case 'inbox':
      userMessagesContainer.appendChild(messagesDashboardComponents[0]);
      break;

    case 'outbox':
      userMessagesContainer.appendChild(messagesDashboardComponents[1]);
      break;

    case 'send-msg':
      userMessagesContainer.appendChild(messagesDashboardComponents[2]);
      break;

    case 'report-spam':
      userMessagesContainer.appendChild(messagesDashboardComponents[3]);
      break;

  }
}

function addMessagesDashboardEventListeners(userMessagesContainer, sendMsg) {
  userMessagesContainer.addEventListener('focus-reply-msg', (ev) => {
    const toRemove = userMessagesContainer.querySelector('.messages-component-outer');
    userMessagesContainer.removeChild(toRemove);
    userMessagesContainer.appendChild(sendMsg);

    const msgReceiverName = sendMsg.querySelector('.message-receiver-name');
    const sendMsgInput = sendMsg.querySelector('.message-receiver-input');
    const sendMsgTa = sendMsg.querySelector('.send-message-ta');

    msgReceiverName.textContent = ev.detail.focus.receiver;
    msgReceiverName.classList.remove('hidden');
    sendMsgInput.classList.add('hidden');
    sendMsgTa.focus();

    const prevLink = userMessagesContainer.querySelector('.displayed');
    const sendMsgLink = userMessagesContainer.querySelector('li[data-link="send-msg"]');
    prevLink.classList.remove('displayed');
    sendMsgLink.classList.add('displayed');
  });
}

export default async function MessagesDashboard() {
  const userMessagesContainer = document.createElement('div');
  userMessagesContainer.className = 'user-messages-container removable';
  userMessagesContainer.id = 'user-messages';

  userMessagesContainer.innerHTML = `
    <div class="user-messages-topbar">
      <ul class="options-list">
        <li class="options-list-item displayed" data-link="inbox">Inbox</li>
        <li class="options-list-item" data-link="outbox">Outbox</li>
        <li class="options-list-item" data-link="send-msg">Send Message</li>
        <li class="options-list-item" data-link="report-spam">Report Spam</li>
      </ul>
    </div>
  `;

  const links = Array.from(userMessagesContainer.querySelectorAll('.options-list-item'));

  links.forEach((link) => {
    link.addEventListener('click', () => {
      messagesDashboardRouting(link);
    });
  });

  const inbox = getInbox();
  const outbox = getOutbox();
  const sendMsg = getSendMsg(userMessagesContainer);
  const reportSpam = getReportSpam();

  const inboxMessagesInner = inbox.querySelector('.inbox-messages-inner');
  const outboxMessagesInner = outbox.querySelector('.outbox-messages-inner');

  await populateInboxOutbox(inboxMessagesInner, outboxMessagesInner);

  messagesDashboardComponents.push(inbox);
  messagesDashboardComponents.push(outbox);
  messagesDashboardComponents.push(sendMsg);
  messagesDashboardComponents.push(reportSpam);

  userMessagesContainer.appendChild(inbox);

  addMessagesDashboardEventListeners(userMessagesContainer, sendMsg);

  return userMessagesContainer;
}
