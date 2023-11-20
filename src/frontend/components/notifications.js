import '../styles/notifications.css';
import { getNotifications } from './tribes-db-access';

export default async function Notifications() {
  const nContainer = document.createElement('div');
  nContainer.className = 'notifications-container removable';

  nContainer.innerHTML = `
    <div class="notifications-outer">
      <div class="filter-bar">
        <ul class="filter-list">
          <li class="filter-list-option displayed">All</li>
          <li class="filter-list-option">Friends</li>
          <li class="filter-list-option">Tribes</li>
          <li class="filter-list-option">Yapp</li>
      </ul>
      </div>
      <div class="notifications-scroll-wrapper">
        <div class="notifications-inner"></div>
      </div>
    </div>
  `;

  const nInner = nContainer.querySelector('notifications-inner');

  const notifications = await getNotifications();

  notifications.forEach(notification => {
    const nCard = document.createElement('div');
    nCard.className = `notification-card ${notification.type}`;

    nCard.innerHTML = `
      <h3 class="notification-sender">${notification.sender}</h3>
      <div class="notification-msg">${notification.message}</div>
      <div class="notification-timestamp">${notification.timestamp}</div>
    `;

    nInner.appenedChild(notification);
  });

  return nContainer;
}
