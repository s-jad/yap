import '../styles/friends.css';
import { getFriendsCardOptionsModal, getNotificationModal } from './modals';
import { getFriends } from "./tribes-db-access";

function checkUserActive(lastLogin, lastLogout) {
    const loggedIn = lastLogin > lastLogout;

    let userStatus;
    let userClassStatus;
    if (loggedIn) {
      userStatus = 'Active';
      userClassStatus = 'active';
    } else {
      userStatus = 'Logged out';
      userClassStatus = 'inactive';
    }

  return {
    userStatus,
    userClassStatus,
  };
}

function checkUserTribeActivity(lastLogin, lastLogout) {
    const loggedIn = lastLogin > lastLogout;

    let tribeStatus;
    let tribeClassStatus;
    if (loggedIn) {
      tribeStatus = 'In chat';
      tribeClassStatus = 'active';
    } else {
      tribeStatus = 'Not in chat';
      tribeClassStatus = 'inactive';
    }

  return {
    tribeStatus,
    tribeClassStatus,
  };
}

export default async function Friends() {
  const friendsContainer = document.createElement('div');
  friendsContainer.className = 'friends-container removable';
  const friendsContainerInner = document.createElement('div');
  friendsContainerInner.className = 'friends-container-inner';
  friendsContainer.appendChild(friendsContainerInner);

  const friendsList = document.createElement('div');
  friendsList.className = 'friends-list';
  friendsList.innerHTML = `
    <div class="friends-list-header">
      <h3 class="friends-list-head-item">Friend</h3>
      <h3 class="friends-list-head-item">Login</h3>
      <h3 class="friends-list-head-item">Last Tribe Login</h3>
      <h3 class="friends-list-head-item">Tribe Login Status</h3>
    </div>
  `;

  const scrollContainer = document.createElement('div');
  scrollContainer.className = 'friends-list-scroll-wrapper';

  scrollContainer.appendChild(friendsList);

  const friends = await getFriends();
  friends.reverse();
  
  let friendsArr = [];
  friends.forEach((friend) => {
    const friendCard = document.createElement('div');
    friendCard.className = 'friend-card';
    console.log("friend => ", friend)

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
    friendsArr.push(friend.user_name);
  });
  
  friendsContainerInner.appendChild(scrollContainer);

  const notifyFriendsWrapper = document.createElement('div');
  notifyFriendsWrapper.className = 'notify-btn-wrapper';
  const notifyFriendsBtn = document.createElement('button');
  notifyFriendsBtn.className = 'notify-friends-btn';
  notifyFriendsBtn.textContent = 'Notify Friends';

  notifyFriendsBtn.addEventListener('click', () => {
    
    getNotificationModal('friends', friendsArr);
  });

  notifyFriendsWrapper.appendChild(notifyFriendsBtn);
  friendsContainer.appendChild(notifyFriendsWrapper);

  return friendsContainer;
}
