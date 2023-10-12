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

async function postChatMessage(tribe, message, sender, receiver, timestamp, global) {
  return fetch('/api/protected/post-message', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      tribe,
      message,
      sender,
      receiver,
      timestamp,
      global,
    })
  })
  .then(response => {
    if (!response.ok) {
      console.log(response);
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

async function createUser(username, password, joined) {
  return fetch('/api/create-user', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      user: username,
      pw: password,
      joined: joined,
    }),
  })
  .then(response => {
    if (!response.ok) {
      throw new Error('Unable to create user.');
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
  getMessages,
  createTribe,
  createUser,
  authenticateUser,
  postChatMessage,
};
