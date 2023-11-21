import '../styles/notifications.css';
import { getNotifications } from './tribes-db-access';

export default async function Notifications() {
  const nContainer = document.createElement('div');
  nContainer.className = 'notifications-container removable';

  nContainer.innerHTML = `
    <div class="notifications-outer">
      <div class="filter-bar">
        <ul class="filter-list">
          <li class="filter-list-option displayed" data-filter="all">All</li>
          <li class="filter-list-option" data-filter="friends">Friends</li>
          <li class="filter-list-option" data-filter="tribe">Tribes</li>
          <li class="filter-list-option" data-filter="yapp">Yapp</li>
      </ul>
      </div>
      <div class="notifications-scroll-wrapper">
        <div class="notifications-inner"></div>
      </div>
    </div>
  `;

  const nInner = nContainer.querySelector('.notifications-inner');
  const notifications = await getNotifications();

  notifications.forEach((n) => {
    const nCard = document.createElement('div');
    nCard.className = `notification-card ${n.notification_type}`;

    const timestamp = n.notification_timestamp.slice(0, n.notification_timestamp.indexOf('T'));

    nCard.innerHTML = `
      <p class="notification-sender" style="color: hsl(${n.sender_color}, 100%, 70%)">${n.sender_name}</p>
      <p class="notification-content">${n.notification_content}</p>
      <p class="notification-timestamp">${timestamp}</p>
    `;

    nInner.appendChild(nCard);
  });

  const filterOptions = Array.from(nContainer.querySelectorAll('.filter-list-option'));

  filterOptions.forEach((option) => {
    option.addEventListener('click', () => {
      if (!option.classList.contains('displayed')) {
        const currentlyDisplayed = nContainer.querySelector('.displayed');
        currentlyDisplayed.classList.remove('displayed');
        option.classList.add('displayed');

        const dataFilter = option.getAttribute('data-filter');

        const displayedCards = Array.from(nContainer.querySelectorAll('.notification-card'));
        
        displayedCards.forEach((card) => {
          if (dataFilter === 'all') {
            card.classList.remove('hidden');
            return;
          }

          if (
            card.classList.contains(dataFilter)
            && card.classList.contains('hidden')
          ) {
            card.classList.remove('hidden');
          } else if (
            !card.classList.contains(dataFilter)
            && !card.classList.contains('hidden')
          ) {
            card.classList.add('hidden');
          }
        });
      }
    });
  });

  return nContainer;
}
