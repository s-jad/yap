import '../styles/join-tribe.css';
import getTribes from './tribes-db-access';

export default async function JoinTribe() {
  const joinTribeContainer = document.createElement('div');
  joinTribeContainer.id = 'join-tribe-container';
  joinTribeContainer.className = 'removable';

  const tribeGrid = document.createElement('div');
  tribeGrid.className = 'tribe-grid';

  const tribes = await getTribes();
  
  for (let i = 0; i < tribes.length; i += 1) {
    const tribeUrl = tribes[i].tribe_name
        .toLowerCase()
        .replaceAll(' ', '-');

    const tribeCard = document.createElement('a');
    tribeCard.className = 'tribe-link';
    tribeCard.innerHTML = `
      <a class="tribe-link" href="/api/${tribeUrl}" tabindex="${i + 1}">
        <div class="tribe-card">
          <div class="tribe-card-upper-flex">
            <h2 class="tribe-name">${tribes[i].tribe_name}</h2>
            <img class="tribe-icon" alt="Tribal Icon">
          </div>
          <h3 class="tribe-cta">${tribes[i].tribe_cta}</h3>
          <p class="tribe-description">${tribes[i].tribe_description}</p>
        </div>
      </a>
    `;

    tribeGrid.appendChild(tribeCard);
  };

  joinTribeContainer.appendChild(tribeGrid);

  const tribeCardLinks = Array.from(joinTribeContainer.querySelectorAll('.tribe-link'));


  tribeCardLinks.forEach((link) => {
    link.addEventListener('click', (ev) => {
      ev.preventDefault();
    });
  });

  return joinTribeContainer;
}
