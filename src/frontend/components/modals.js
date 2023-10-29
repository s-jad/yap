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

async function getTribeMembersListModal(tribe) {
  const modal = getModal();
  const members = await getTribeMembers(tribe);
  const modalInner = modal.querySelector('.modal-inner');
  
  members.forEach((member) => {
    console.log(`${member.user_name} last logged IN at ${member.last_login}`);
    console.log(`${member.user_name} last logged OUT at ${member.last_logout}`);
    const memberEl = document.createElement('div');
    memberEl.className = 'member-list-item';
    memberEl.innerHTML = `
      <p class="member-name">${member.user_name}</p>
    `;

    modalInner.appendChild(memberEl);
  });

  return modal;
}

export {
  getModal,
  getTribeMembersListModal,
}
