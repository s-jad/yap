import '../styles/friends.css';
import { getFriends } from "./tribes-db-access";

export default async function Friends() {
  const friendsContainer = document.createElement('div');
  friendsContainer.className = 'friends-container removable';
  
  const friendsList = document.createElement('div');
  friendsList.className = 'friends-list';

  const friendsListHead = document.createElement('div');
  friendsListHead.className = 'friends-list-header';

  friendsListHead.innerHTML = `
    <h3 class="friends-list-head-item">Friend</h3>
    <h3 class="friends-list-head-item">Last Tribe Login</h3>
    <h3 class="friends-list-head-item">Status</h3>
  `;
  
  friendsList.appendChild(friendsListHead);

  const friends = await getFriends();
  friends.reverse();

  friends.forEach((friend) => {
    const friendCard = document.createElement('div');
    friendCard.className = 'friend-card';
  
    const loggedIn = friend.last_login > friend.last_logout;

    let status;
    let classStatus;
    if (loggedIn) {
      status = 'Active';
      classStatus = 'active';
    } else {
      status = 'Logged out';
      classStatus = 'inactive';
    }

    friendCard.innerHTML = `
      <p class="friend-name">${friend.user_name}</p>
      <p class="friend-last-tribe-login">${friend.tribe_name}</p>
      <p class="friend-active-status ${classStatus}">${status}</p>
    `;

    friendsList.appendChild(friendCard);
  });

  friendsContainer.appendChild(friendsList);

  return friendsContainer;
}
