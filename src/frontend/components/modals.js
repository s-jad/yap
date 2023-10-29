import { getTribeMembers } from "./tribes-db-access";

function getModal() {
  const modalOuter = document.createElement('div');
  modalOuter.className = 'modal-outer';
  const modalInner = document.createElement('div');
  modalInner.className = 'modal-inner';
  modalOuter.appendChild(modalInner);

  return modalOuter;
}

async function getTribeMembersListModal(tribe) {
  const modal = getModal();
  const members = await getTribeMembers(tribe);
  const modalInner = modal.querySelector('.modal-inner');
  
  members.forEach((member) => {
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
