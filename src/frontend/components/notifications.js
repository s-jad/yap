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

  const nInner = nContainer.querySelector('.notifications-inner');
  const notifications = await getNotifications();

  console.log("notifications => ", notifications);
  notifications.forEach((n) => {
    const nCard = document.createElement('div');
    nCard.className = `notification-card ${n.notification_type}`;

    nCard.innerHTML = `
      <h3 class="notification-sender">${n.notification_sender}</h3>
      <div class="notification-msg">${n.notification_content}</div>
      <div class="notification-timestamp">${n.notification_timestamp}</div>
    `;

    nInner.appendChild(nCard);
  });

  return nContainer;
}
