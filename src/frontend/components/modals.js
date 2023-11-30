import { showDialog } from "./app-state";
import { emitFocusEvent } from "./events";
import { handleChatroomLinks, handleClientSideLinks } from "./fetch_apis";
import { checkUserActive, checkUserTribeActivity } from "./friends";
import { getNotificationIcon, getXIcon } from "./icons";
import { applyForInvitation, getApplicants, getFriends, getTribeMembers, postNotification } from "./tribes-db-access";

function closeModal(modal) {
  document.body.removeChild(modal);
}

function getScrollableModal() {
  const modal = document.createElement('div');
  modal.className = 'modal-outer';
  const modalInner = document.createElement('div');
  modalInner.className = 'modal-inner';
  const headerContainer = document.createElement('div');
  headerContainer.className = 'modal-header-container';
  headerContainer.innerHTML = `
    <div class="modal-headers"></div>
    <div class="modal-btn-container"></div>
  `;
  
  const modalBtnContainer = headerContainer.querySelector('.modal-btn-container');
  const xBtnWrapper = document.createElement('div');
  xBtnWrapper.appendChild(getXIcon());
  xBtnWrapper.className = 'header-btn-wrapper x-btn-wrapper';
  xBtnWrapper.addEventListener('click', () => {
    closeModal(modal);
  });

  modalBtnContainer.appendChild(xBtnWrapper);

  const headers = headerContainer.querySelector('.modal-headers');
  modalInner.appendChild(headerContainer);

  const modalScrollOuter = document.createElement('div');
  modalScrollOuter.className = 'modal-scroll-wrapper';
  const modalScrollInner = document.createElement('div');
  modalScrollInner.className = 'modal-scroll-inner';
  modalScrollOuter.appendChild(modalScrollInner);
  modalInner.appendChild(modalScrollOuter);

  modal.appendChild(modalInner);

  return { 
    modal,
    modalInner,
    headers,
    modalScrollInner,
    modalBtnContainer
  };
}

function getModal() {
  const modal = document.createElement('div');
  modal.className = 'modal-outer';
  const modalInner = document.createElement('div');
  modalInner.className = 'modal-inner';

  const headerContainer = document.createElement('div');
  headerContainer.className = 'modal-header-container';
  headerContainer.innerHTML = `
    <div class="modal-headers"></div>
    <div class="modal-btn-container"></div>
  `;

  const modalBtnContainer = headerContainer.querySelector('.modal-btn-container');
  const headers = headerContainer.querySelector('.modal-headers');

  const xBtnWrapper = document.createElement('div');
  xBtnWrapper.appendChild(getXIcon());
  xBtnWrapper.className = 'header-btn-wrapper x-btn-wrapper';
  xBtnWrapper.addEventListener('click', () => {
    closeModal(modal);
  });

  modalBtnContainer.appendChild(xBtnWrapper);

  modalInner.appendChild(headerContainer);
  modal.appendChild(modalInner);

  return { 
    modal,
    modalInner,
    headers,
    modalBtnContainer,
  };
}

async function getFriendsListModal() {
  const {
    modal,
    modalInner,
    modalScrollInner,
    headers,
    modalBtnContainer,
  } = getScrollableModal();
  
  modalInner.classList.add('fl-modal-inner');

  const headerWrapper = document.createElement('div');
  headerWrapper.className = 'friends-list-headers';
  headerWrapper.innerHTML = `
      <h3 class="friends-list-head-item">Friend</h3>
      <h3 class="friends-list-head-item">Login</h3>
      <h3 class="friends-list-head-item">Last Tribe Login</h3>
  `;

  headers.appendChild(headerWrapper);

  const friends = await getFriends();
  friends.reverse();
  
  const notificationIconWrapper = document.createElement('div');
  notificationIconWrapper.className = 'header-btn-wrapper notification-btn-wrapper';
  notificationIconWrapper.appendChild(getNotificationIcon());

  const notificationReceivers = [];
  
  const friendsList = document.createElement('div');
  friendsList.className = 'friends-list';

  friends.forEach((friend) => {
    const friendCard = document.createElement('div');
    friendCard.className = 'friend-card';
    
    const {
      userStatus,
      userClassStatus,
    } = checkUserActive(friend.last_login, friend.last_logout);

    const {
      tribeStatus,
      tribeClassStatus,
    } = checkUserTribeActivity(friend.last_tribe_login, friend.last_tribe_logout);

    friendCard.innerHTML = `
      <p class="friend-name">${friend.user_name}</p>
      <p class="friend-active-status ${userClassStatus}">${userStatus}</p>
      <p class="friend-last-tribe-login">${friend.tribe_name}</p>
      <p class="friend-tribe-active-status ${tribeClassStatus}">${tribeStatus}</p>
    `;

    friendCard.addEventListener('click', () => {
      getFriendsCardOptionsModal(friend);
    });

    friendsList.appendChild(friendCard);
    notificationReceivers.push(friend.user_name);
  });

  modalScrollInner.appendChild(friendsList);
  
  notificationIconWrapper.addEventListener('click', () => {
    getNotificationModal('friends', notificationReceivers);
  });

  modalBtnContainer.prepend(notificationIconWrapper);

  document.body.appendChild(modal);
}

function getNotificationModal(type, receivers) {
  const {
    modal,
    modalInner,
    headers, 
  } = getModal();

  const headerContent = document.createElement('div');
  headerContent.className = 'header-sub-wrapper';

  headerContent.innerHTML = `
    <h3 class="notification-type">Notify ${type}</h3>
  `;
  headers.appendChild(headerContent);

  modalInner.classList.add('notification-modal-inner');
  
  const writeNotificationWrapper = document.createElement('div');
  writeNotificationWrapper.className = 'notification-wrapper';
  writeNotificationWrapper.innerHTML = `
    <input type="text" class="notification-header" placeholder="Title"/>
    <textarea class="notification-content" placeholder="Body Text"></textarea>
    <div class="btn-wrapper">
      <button class="send-notification-btn">Send</button>
    </div>
  `;
  
  const nHeader = writeNotificationWrapper.querySelector('.notification-header');
  const nContent = writeNotificationWrapper.querySelector('.notification-content');
  const sendBtn = writeNotificationWrapper.querySelector('.send-notification-btn');
  const appContainer = document.body.querySelector('#app');

  sendBtn.addEventListener('click', async () => {
    const res = postNotification(type, nHeader.value, nContent.value, receivers);
  
    if (res) {
      showDialog(
        appContainer,
        'Notification sent!',
        'notification-send-success',
        'success',
        'center',
      );
    } else {
      showDialog(
        appContainer,
        'Ooops, something went wrong, please try again later!',
        'notification-send-failure',
        'fail',
        'center',
      );
    }
    document.body.removeChild(modal);
  });
  
  modalInner.appendChild(writeNotificationWrapper);
  document.body.appendChild(modal);
  nHeader.focus();
}

function getFriendsCardOptionsModal(friend) {
  const {
    modal,
    modalInner,
    headers, 
  } = getModal();

  modalInner.classList.add('fcmo-modal-inner');

  const fcmoBtnContainer = document.createElement('div');
  fcmoBtnContainer.className = 'fcmo-btn-container';

  const sendMsgBtn = document.createElement('button');
  sendMsgBtn.type = 'button';
  sendMsgBtn.className = 'fcmo-send-message';
  sendMsgBtn.textContent = 'Send Message';
  fcmoBtnContainer.appendChild(sendMsgBtn);

  const joinChatBtn = document.createElement('button');
  joinChatBtn.type = 'button';
  joinChatBtn.className = 'fcmo-join-chat';
  joinChatBtn.textContent = 'Join Chat';
  fcmoBtnContainer.appendChild(joinChatBtn);

  const viewProfileBtn = document.createElement('button');
  viewProfileBtn.type = 'button';
  viewProfileBtn.className = 'fcmo-view-profile';
  viewProfileBtn.textContent = 'View Profile';
  fcmoBtnContainer.appendChild(viewProfileBtn);

  sendMsgBtn.addEventListener('click', () => {
    const focus = { receiver: friend.user_name };
    handleClientSideLinks('/inbox', focus);
    closeModal(modal);
  });

  joinChatBtn.addEventListener('click', () => {
    const tribe = `/${friend.tribe_name.replaceAll(' ', '-')}`;
    handleChatroomLinks(tribe);
    closeModal(modal);
  });

  viewProfileBtn.addEventListener('click', () => {
    console.log('linking to profile from', friend.user_name);
    closeModal(modal);
  });

  modalInner.appendChild(fcmoBtnContainer);

  document.body.appendChild(modal);
}

async function getTribeApplicationsListModal(tribe) {
  const { 
    modal,
    modalInner,
    headers,
    modalScrollInner 
  } = getScrollableModal();
  
  const headerContent = document.createElement('div');
  headerContent.className = 'header-sub-wrapper';
  headerContent.innerHTML = `
    <h3 class="leading-header">Applying</h3>
    <h3>Date</h3>
  `;

  headers.appendChild(headerContent);

  const applicants = await getApplicants(tribe);
  modalInner.classList.add('gtal-modal-inner');

  if (applicants === undefined) {
    const tribeChat = document.body.querySelector('#tribe-chat-container');
    showDialog(
      tribeChat,
      'No applicants to join the tribe at the current time.',
      'applicants-modal-failure',
      'fail',
      'center',
    );
    return;
  } else {
    applicants.forEach((applicant) => {
      const appDate = applicant.application_date.slice(0, applicant.application_date.indexOf('T'));

      const applicantEl = document.createElement('div');
      applicantEl.className = 'applicant-list-item';
      applicantEl.innerHTML = `
        <p class="applicant-name">${applicant.user_name}</p>
        <p class="application-date">${appDate}</p>
        `;

      applicantEl.addEventListener('click', () => {
        console.log("showing profile, accept/deny buttons");
      });

      modalScrollInner.appendChild(applicantEl);
    });

    document.body.appendChild(modal);
  }
  
}

async function getTribeMembersListModal(tribe) {
  const { 
    modal,
    modalInner,
    headers,
    modalScrollInner,
    modalBtnContainer,
  } = getScrollableModal();
  
  const headerContent = document.createElement('div');
  headerContent.className = 'header-sub-wrapper';
  headerContent.innerHTML = `
    <h3 class="leading-header">Member</h3>
    <h3>Activity</h3>
  `;

  const notificationIconWrapper = document.createElement('div');
  notificationIconWrapper.className = 'header-btn-wrapper notification-btn-wrapper';
  notificationIconWrapper.appendChild(getNotificationIcon());

  const notificationReceivers = [];

  const members = await getTribeMembers(tribe);
  modalInner.classList.add('gtml-modal-inner');
  members.forEach((member) => {
    const activeIndicator = document.createElement('p');
    activeIndicator.className = 'active-indicator';
    if (member.last_login > member.last_logout) {
      activeIndicator.classList.add('member-active')
      activeIndicator.textContent = 'Active';
    } else {
      const lastLogout = member.last_logout;
      const parts = lastLogout.split('T');
      const date = parts[0];
      const time = parts[1].split('.')[0];
      activeIndicator.classList.add('member-inactive')
      activeIndicator.textContent = `Last seen: ${time} ${date}`;
    }
    const memberEl = document.createElement('div');
    memberEl.className = 'member-list-item';
    memberEl.innerHTML = `
      <p class="member-name">${member.user_name}</p>
    `;

    memberEl.addEventListener('click', () => {
      const tribeChat = document.querySelector('#tribe-chat-container');
      if (member.last_login > member.last_logout) {
        const focus = {
          replyTo: member.user_name,
        };

        emitFocusEvent('/members', tribeChat, focus);
        closeModal(modal);
      } else {
        showDialog(
          tribeChat,
          'Can only post messages to currently active members',
          'post-msg-failure',
          'fail',
          'center',
        );
      }
    });

    notificationReceivers.push(member.user_name);
    memberEl.appendChild(activeIndicator);
    modalScrollInner.appendChild(memberEl);
  });

  notificationIconWrapper.addEventListener('click', () => {
    closeModal(modal);
    getNotificationModal('tribe', notificationReceivers);
  });
  
  modalBtnContainer.prepend(notificationIconWrapper);

  headers.appendChild(headerContent);

  document.body.appendChild(modal);
}

function getApplyForInvitationModal(tribe) {
  const {
    modal,
    modalInner,
    headers,
  } = getModal();

  modalInner.classList.add('afi-modal-inner');
  
  const headerContent = document.createElement('h3');
  headerContent.className = 'header-content';
  headerContent.textContent = `Apply for an invitation to ${tribe.tribe_name}?`
  headers.appendChild(headerContent);

  const btnWrapper = document.createElement('div');
  btnWrapper.className = 'btn-wrapper';
  btnWrapper.innerHTML = `
    <button class="afi-apply-btn">Apply</button>
    <button class="afi-cancel-btn">Cancel</button>
  `;
  
  modalInner.appendChild(btnWrapper);

  const afiApplyBtn = modalInner.querySelector('.afi-apply-btn');
  const joinTribe = document.querySelector('#join-tribe-container');
  afiApplyBtn.addEventListener('click', async () => {
    const applicationRes = await applyForInvitation(tribe.tribe_name);

    if (applicationRes === true) {
      showDialog(
        joinTribe,
        `Application sent to ${tribe.tribe_name}!`,
        'afi-modal-success',
        'success',
        'center',
      );
    } else {
      showDialog(
        joinTribe,
        `${applicationRes}`,
        'afi-modal-failure',
        'fail',
        'center',
      );
    }

    setTimeout(() => {
      closeModal(modal);
    }, 100);
  });

  const afiCancelBtn = modalInner.querySelector('.afi-cancel-btn');
  afiCancelBtn.addEventListener('click', () => {
    closeModal(modal);
  });

  document.body.appendChild(modal);
}

export {
  getModal,
  getTribeMembersListModal,
  getTribeApplicationsListModal,
  getFriendsCardOptionsModal,
  getApplyForInvitationModal,
  getNotificationModal,
  getFriendsListModal,
}
