import { handleChatroomLinks } from "./fetch_apis";
import { getTribeMembers } from "./tribes-db-access";

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
    console.log('linking to inbox');
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

  return modal;
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
    memberEl.appendChild(activeIndicator);

    modalScroll.appendChild(memberEl);
  });

  return modal;
}

export {
  getModal,
  getTribeMembersListModal,
  getFriendsCardOptionsModal,
}
