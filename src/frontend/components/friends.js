import '../styles/friends.css';

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

export {
  checkUserActive,
  checkUserTribeActivity,
}
