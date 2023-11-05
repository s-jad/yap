import { getFriends } from "./tribes-db-access";

export default async function Friends() {
  const friendsContainer = document.createElement('div');
  friendsContainer.className = 'friends-container removable';
  
  const friendsList = document.createElement('div');
  friendsList.className = 'friends-list';

  const friends = await getFriends();
  console.log("Friends list => ", friends);

  return friendsContainer;
}
