import { showDialog } from "./app-state";
import { emitFocusEvent } from "./events";
import { handleChatroomLinks, handleClientSideLinks } from "./fetch_apis";
import { applyForInvitation, getApplicants, getTribeMembers } from "./tribes-db-access";

function closeModal(modal) {
  document.body.removeChild(modal);
}

function getModal() {
  const modalOuter = document.createElement('div');
  modalOuter.className = 'modal-outer';
  const modalInner = document.createElement('div');
  modalInner.className = 'modal-inner';
  const btnContainer = document.createElement('div');
  btnContainer.className = 'modal-btn-container';
  btnContainer.innerHTML = `
    <button type="button" class="invisible-btn"></button>
    <div class="close-modal-btn">X</div>
  `;

  const btn = btnContainer.querySelector('button');
  btn.addEventListener('click', () => {
    closeModal(modalOuter);
  });

  modalInner.appendChild(btnContainer);
  modalOuter.appendChild(modalInner);

  return modalOuter;
}

function getFriendsCardOptionsModal(friend) {
  const modal = getModal();

  const modalInner = modal.querySelector('.modal-inner');
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
    const tribe = `/${friend.tribe_name.replaceAll(' ', '-').toLowerCase()}`;
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
  const modal = getModal();
  const applicants = await getApplicants(tribe);
  const modalInner = modal.querySelector('.modal-inner');
  modalInner.classList.add('gtal-modal-inner');
  const modalScroll = document.createElement('div');
  modalScroll.className = 'modal-scroll-wrapper';
  modalInner.appendChild(modalScroll);

  applicants.forEach((applicant) => {
    const applicantEl = document.createElement('div');
    applicantEl.className = 'applicant-list-item';
    applicantEl.innerHTML = `
      <p class="applicant-name">${applicant.user_name}</p>
      <p class="application-date">${applicant.application_date}</p>
    `;
    
    applicantEl.addEventListener('click', () => {
      console.log("showing profile, accept/deny buttons");
    });
  });

  document.body.appendChild(modal);
}

async function getTribeMembersListModal(tribe) {
  const modal = getModal();
  const members = await getTribeMembers(tribe);
  const modalInner = modal.querySelector('.modal-inner');
  modalInner.classList.add('gtml-modal-inner');
  const modalScroll = document.createElement('div');
  modalScroll.className = 'modal-scroll-wrapper';
  modalInner.appendChild(modalScroll);

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
          'fail'
        );
      }
    });

    memberEl.appendChild(activeIndicator);

    modalScroll.appendChild(memberEl);
  });

  document.body.appendChild(modal);
}

function getApplyForInvitationModal(tribe) {
  const modal = getModal();
  const modalInner = modal.querySelector('.modal-inner');
  modalInner.classList.add('afi-modal-inner');
  console.log("Inside the modal!!!");

  modalInner.innerHTML = `
    <h2 class="afi-modal-header">Apply for an invitation to ${tribe.tribe_name}?</h2>
    <button class="afi-apply-btn">Apply</button>
    <button class="afi-cancel-btn">Cancel</button>
  `;

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
      );
    } else {
      showDialog(
        joinTribe,
        `${applicationRes}`,
        'afi-modal-failure',
        'fail',
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

  modal.appendChild(modalInner);

  document.body.appendChild(modal);
}

export {
  getModal,
  getTribeMembersListModal,
  getTribeApplicationsListModal,
  getFriendsCardOptionsModal,
  getApplyForInvitationModal,
}
