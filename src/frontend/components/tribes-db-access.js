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
  console.log("applyForInvitation::tribeName => ", tribeName);
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
async function createTribe() {
  return fetch('/api/protected/create-a-tribe')
    .then(response => {
      if (!response.ok) {
        throw new Error('Unable to create tribe.');
      }
      return response.text().then(text => {
        try {
          const json = JSON.parse(text);
          return json;
        } catch (error) {
          console.error('createTribe::Error parsing JSON', error);
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
          console.error('createTribe::Error parsing JSON', error);
          throw new Error('Error parsing JSON');
        }
      });
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
          console.error('createTribe::Error parsing JSON', error);
          throw new Error('Error parsing JSON');
        }
      });
    });
}

async function postChatMessage(tribe, message, receiver, timestamp, global) {
  return fetch('/api/protected/post-message', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({
      tribe,
      message,
      receiver,
      timestamp,
      global,
    })
  })
    .then(response => {
      if (!response.ok) {
        throw new Error('Unable to post message.');
      }
      return response.json().then(json => {
        if (json.message === 'Data was posted successfully.') {
          console.log('Message posted successfully.');
        }
        return json;
      })
    })
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

export {
  getTribes,
  getTribeMembers,
  getFriends,
  //  updateTribeMemberLogin,
  //  updateTribeMemberLogout,
  getMessages,
  getInboxMessages,
  getInboxMessageCount,
  deleteInboxMessage,
  sendInboxMessage,
  replyToInboxMessage,
  getLastTribeLogins,
  getRandomTribeSuggestions,
  createTribe,
  createUser,
  authenticateUser,
  postChatMessage,
  postUserReport,
  applyForInvitation,
};
