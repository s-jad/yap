import '../styles/join-tribe.css';
import { checkMembership, getTribes } from './tribes-db-access';
import { handleChatroomLinks } from './fetch_apis';
import { getApplyForInvitationModal } from './modals';
import { convertAsciiToIcon, getGenericTribeIcon } from './icons';

async function populateTribesGrid(tribeGrid) {
  const tribes = await getTribes();

  for (let i = 0; i < tribes.length; i += 1) {
    const tribeUrl = tribes[i].tribe_name
      .toLowerCase()
      .replaceAll(' ', '-');

    let privacy;
    let privacyClass;
    if (tribes[i].private) {
      privacy = 'Private';
      privacyClass = 'private-tribe';
    } else {
      privacy = 'Public';
      privacyClass = 'public-tribe';
    }

    const tribeCard = document.createElement('div');
    tribeCard.className = `tribe-card-container ${privacyClass}`;
    tribeCard.innerHTML = `
      <a class="tribe-link" href="/api/protected/tribe-chat/${tribeUrl}" data-link="/tribe-chat/${tribeUrl}" tabindex="${i + 4}">
        <div class="tribe-card">
          <div class="tribe-card-upper-flex">
            <h2 class="tribe-name">${tribes[i].tribe_name}</h2>
          </div>
          <h3 class="tribe-cta">${tribes[i].tribe_cta}</h3>
          <p class="tribe-description">${tribes[i].tribe_description}</p>
          <p class="tribe-privacy">${privacy}</p>
        </div>
      </a>
    `;

    const tribeCardUpperFlex = tribeCard.querySelector('.tribe-card-upper-flex');

    let icon;
    if (tribes[i].tribe_icon === null) {
      icon = getGenericTribeIcon();
    } else {
      icon = convertAsciiToIcon(tribes[i].tribe_icon);
    }

    tribeCardUpperFlex.appendChild(icon);

    const tribePrivacy = tribeCard.querySelector('.tribe-privacy');

    const tribeCardLink = tribeCard.querySelector('.tribe-link');
    tribeCardLink.addEventListener('click', async (ev) => {
      if (tribePrivacy.textContent === 'Public') {
        ev.preventDefault();
        const linkUrl = tribeCardLink.getAttribute('data-link');
        history.pushState(null, null, linkUrl);
        const urlSplit = linkUrl.split('/');
        const tribeUrl = `/${urlSplit[2]}`;
        handleChatroomLinks(tribeUrl);
      } else if (tribePrivacy.textContent === 'Private') {
        ev.preventDefault();
        const memberStatus = await checkMembership(tribes[i].tribe_name);
        if (
          memberStatus === 'mod'
          || memberStatus === 'founder'
          || memberStatus === 'member'
          || memberStatus === 'admin'
        ) {
          const linkUrl = tribeCardLink.getAttribute('data-link');
          history.pushState(null, null, linkUrl);
          const urlSplit = linkUrl.split('/');
          const tribeUrl = `/${urlSplit[2]}`;
          handleChatroomLinks(tribeUrl, memberStatus);
        } else {
          getApplyForInvitationModal(tribes[i]);
        }
      }
    });

    tribeGrid.appendChild(tribeCard);
  };

  return tribeGrid;
}

export default async function JoinTribe() {
  const joinTribeContainer = document.createElement('div');
  joinTribeContainer.id = 'join-tribe-container';
  joinTribeContainer.className = 'removable';

  const tribeGrid = document.createElement('div');
  tribeGrid.className = 'tribe-grid';

  populateTribesGrid(tribeGrid);

  joinTribeContainer.appendChild(tribeGrid);

  return joinTribeContainer;
}
