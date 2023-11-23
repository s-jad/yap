// TEST REQUEST SPEEDS 
//async function timeRequest(url) {
//  const startTime = new Date();
//  const response = await fetch(url);
//  const data = await response.json();
//  const endTime = new Date();
//  const duration = endTime - startTime;
//  return { duration, data };
//} 
// 
//async function compareRequests(rep, url1, url2) {
//  let res1dur = 0;
//  let res2dur = 0;
//  for (let i = 0; i < rep; i++) {
//    const result1 = await timeRequest(url1);
//    const result2 = await timeRequest(url2);
//    res1dur += result1.duration;
//    res2dur += result2.duration
//  }
//  
//  console.log(`request: ${url1} took an average of ${res1dur / rep}ms over ${rep} requests`);
//  console.log(`request: ${url2} took an average of ${res2dur / rep}ms over ${rep} requests`);
//} 
// 
//compareRequests(1000, '/api/protected/join-a-tribe-redis', '/api/protected/join-a-tribe-pg');

async function logoutUser() {
  return fetch('/api/logout-user')
    .then(response => {
      if (!response.ok) {
        console.log('Unable to logout user');
      }
      return response.json().then(data => {
        try {
          const logout = data.logout;
          return logout;
        } catch (error) {
          console.error('logoutUser::Error parsing JSON', error);
        }
      })
    });
}

async function getTribes() {
  return fetch('/api/protected/join-a-tribe')
    .then(response => {
      if (!response.ok) {
        throw new Error('Unable to get tribes.');
      }
      return response.text().then(text => {
        try {
          const json = JSON.parse(text);
          return json;
        } catch (error) {
          console.error('getTribes::Error parsing JSON', error);
          throw new Error('Error parsing JSON');
        }
      });
    });
}


async function getTribeMembers(tribe) {
  return fetch(`/api/protected/get-tribe-members?tribe=${encodeURIComponent(tribe)}`, {
    method: 'GET',
  })
    .then((response) => {
      return response.json();
    })
    .then((data) => {
      const members = data;
      return members;
    })
    .catch((error) => {
      console.error('fetchTribeMembers::Error:', error);
    });
}

async function applyForInvitation(tribeName) {
  return fetch('/api/protected/apply-for-invitation', {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ tribeName }),
  })
    .then((response) => {
      if (!response.ok) {
        return new Error('Unable to apply for invitation');
      }
      return true;
    });
}

async function getApplicants(tribeName) {
  console.log("getApplicants::tribeName => ", tribeName);
  return fetch(`/api/protected/get-applicants?tribe=${encodeURIComponent(tribeName)}`, {
    method: 'GET',
  })
    .then((response) => {
      if (!response.ok) {
        return new Error('Unable to get applicants for invitation');
      }
      return response.json();
    })
    .then((data) => {
      const applicants = data.rows;
      return applicants;
    })
    .catch((error) => {
      console.error('error returning applicants => ', error);
    });
}

async function checkMembership(tribe) {
  return fetch(`/api/protected/check-membership?tribe=${encodeURIComponent(tribe)}`, {
    method: 'GET',
    credentials: 'include',
  })
    .then(response => {
      if (!response.ok) {
        throw new Error('Unable to check membership');
      }
      return response.json();
    })
    .then((data) => {
      const role = data.member_role;
      return role;
    })
    .catch((error) => {
      console.error("checkMembership::error => ", error);
    });
}

async function getFriends() {
  return fetch('/api/protected/get-friends', {
    method: 'GET',
    credentials: 'include',
  })
    .then(response => {
      if (!response.ok) {
        throw new Error('Unable to fetch friends list');
      }
      return response.text().then(text => {
        try {
          const friendsJson = JSON.parse(text);
          return friendsJson;
        } catch (error) {
          console.err('getFriends::Error parsing JSON', error);
          throw new Error('Error parsing JSON');
        }
      });
    });
}

async function getRandomTribeSuggestions() {
  return fetch(`/api/protected/get-random-tribe-suggestions`, {
    method: 'GET',
    credentials: 'include',
  })
    .then(response => {
      if (!response.ok) {
        throw new Error('Unable to get random tribe suggestions');
      }
      return response.text().then(text => {
        try {
          const json = JSON.parse(text);
          return json;
        } catch (error) {
          console.error('getRandomTribeSuggestions::Error parsing JSON => ', error);
          throw new Error('Error parsing JSON');
        }
      });
    });
}

async function getLastTribeLogins() {
  return fetch(`/api/protected/get-last-tribe-logins`, {
    method: 'GET',
    credentials: 'include',
  })
    .then(response => {
      if (!response.ok) {
        throw new Error('Unable to get last tribe logins');
      }
      return response.text().then(text => {
        try {
          const json = JSON.parse(text);
          return json;
        } catch (error) {
          console.error('getLastTribeLogins::Error parsing JSON => ', error);
          throw new Error('Error parsing JSON');
        }
      });
    });
}

async function getMessages(tribeUrl) {
  return fetch(`/api/protected/get-chatroom-messages?tribeUrl=${encodeURIComponent(tribeUrl)}`)
    .then(response => {
      if (!response.ok) {
        throw new Error('Unable to get messages.');
      }
      return response.text().then(text => {
        try {
          const json = JSON.parse(text);
          return json;
        } catch (error) {
          console.error('getMessages::Error parsing JSON', error);
          throw new Error('Error parsing JSON');
        }
      });
    });
}

async function getNotifications() {
  return fetch('/api/protected/get-notifications', {
    method: 'GET',
    credentials: 'include',
  })
    .then(response => {
      if (!response.ok) {
        throw new Error('Unable to get notifications')
      }
      try {
        const notifications = response.json();
        return notifications;
      } catch (error) {
        console.error('getNotifications::Error parsing JSON', error);
      }
    });
}

async function postNotification(notification) {
  return fetch('/api/protected/post-notification', {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ notification }),
  })
  .then(response => {
    if (!response.ok) {
      throw new Error('Unable to post notification at this time.');
    } else {
      return true;
    }
  });
}

async function getInboxMessageCount() {
  return fetch('/api/protected/get-inbox-message-count', {
    method: 'GET',
    credentials: 'include',
  })
    .then(response => {
      if (!response.ok) {
        throw new Error('Unable to get user inbox message count.')
      }
      return response.text().then(text => {
        try {
          const json = JSON.parse(text);
          return json;
        } catch (err) {
          console.error('getInboxMessageCount::Error parsing JSON', error);
          throw new Error('Error parsing JSON');
        }
      });
    });
}

async function deleteInboxMessage(msgIds) {
  return fetch(`/api/protected/delete-inbox-message`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json'
    },
    credentials: 'include',
    body: JSON.stringify({ msgIds }),
  })
    .then(response => {
      if (!response.ok) {
        throw new Error('Unable to delete message.');
      } else {
        return true;
      }
    });
}

async function sendInboxMessage(msgData) {
  return fetch('/api/protected/send-inbox-message', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    credentials: 'include',
    body: JSON.stringify({ msgData }),
  })
    .then(response => {
      if (!response.ok) {
        return false;
      } else {
        return true;
      }
    });
}

async function replyToInboxMessage(parentMsgId, newMsg) {
  return fetch(`/api/protected/reply-to-inbox-message`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    credentials: 'include',
    body: JSON.stringify({ parentMsgId, newMsg }),
  })
    .then(response => {
      if (!response.ok) {
        throw new Error('Unable to reply to message.');
      } else {
        return true;
      }
    });
}

async function getInboxMessages() {
  return fetch(`/api/protected/get-inbox-messages`, {
    method: 'GET',
    credentials: 'include',
  })
    .then(response => {
      if (!response.ok) {
        throw new Error('Unable to get messages.');
      }
      return response.text().then(text => {
        try {
          const json = JSON.parse(text);
          return json;
        } catch (error) {
          console.error('getInboxMessages::Error parsing JSON', error);
          throw new Error('Error parsing JSON');
        }
      });
    });
}

async function createUser(username, password, joined, userColor) {
  return fetch('/api/create-user', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      user: username,
      pw: password,
      joined,
      userColor
    }),
  })
    .then(response => {
      if (!response.ok) {
        throw new Error(`The username ${username} is not available`);
      }
      return response.text().then(text => {
        try {
          const json = JSON.parse(text);
          return json;
        } catch (error) {
          console.error('createUser::Error parsing JSON', error);
          throw new Error('Error parsing JSON');
        }
      });
    });
}

// NOTE: May be necessary, lets see if the socket method works well first
// async function updateTribeMemberLogin(timestamp, tribe) {
//   return fetch('/api/protected/update-tribe-member-login', {
//     method: 'PATCH',
//     credentials: 'include',
//     headers: {
//       'Content-Type': 'application/json',
//     },
//     body: JSON.stringify({ timestamp, tribe }),
//   })
//   .then(response => {
//     if (!response.ok) {
//       throw new Error('Unable to update login details.');
//     } else {
//       return true;
//     }  
//   });
// }
// 
// async function updateTribeMemberLogout(timestamp, tribe) {
//   return fetch('/api/protected/update-tribe-member-logout', {
//     method: 'PATCH',
//     credentials: 'include',
//     headers: {
//       'Content-Type': 'application/json',
//     },
//     body: JSON.stringify({ timestamp, tribe }),
//   })
//   .then(response => {
//     if (!response.ok) {
//       throw new Error('Unable to update logout details.');
//     } else {
//       return true;
//     }  
//   });
// }

async function postUserReport(formData) {
  console.log("postUserReport::formData => ", formData);
  return fetch('/api/protected/report-user-incident', {
    method: 'POST',
    body: formData,
  })
    .then(response => {
      if (!response.ok) {
        throw new Error('Unable to post report');
      }
      return response.json().then(json => {
        if (json.message === 'Data was posted successfully.') {
          console.log('Message posted successfully.');
        }
        return json;
      });
    });
}

async function authenticateUser(username, password) {
  return fetch('/api/authenticate-user', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      user: username,
      pw: password,
    }),
  })
    .then(response => {
      if (!response.ok) {
        throw new Error('Incorrect username or password.');
      }
      return response.text().then(text => {
        try {
          const json = JSON.parse(text);
          return json;
        } catch (error) {
          console.error('authenticateUser::Error parsing JSON', error);
          throw new Error('Error parsing JSON');
        }
      });
    });
}

async function getAdminDashboard() {
  return fetch('/api/admin/admin-tools', {
    method: 'GET',
    credentials: 'include',
  })
  .then(response => {
    if (!response.ok) {
      throw new Error('You do not have admin privileges')
    }
    response.text().then(data => {
      console.log("data >= ", data);
      return data;

    });
  });
}

export {
  getTribes,
  getTribeMembers,
  getFriends,
  //  updateTribeMemberLogin,
  //  updateTribeMemberLogout,
  getNotifications,
  getMessages,
  getInboxMessages,
  getInboxMessageCount,
  deleteInboxMessage,
  sendInboxMessage,
  replyToInboxMessage,
  getLastTribeLogins,
  getRandomTribeSuggestions,
  createUser,
  authenticateUser,
  postUserReport,
  applyForInvitation,
  getApplicants,
  checkMembership,
  logoutUser,
  getAdminDashboard,
};
