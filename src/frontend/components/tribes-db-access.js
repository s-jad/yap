async function getTribes() {
  return fetch('/api/join-a-tribe')
    .then(response => {
      if (!response.ok) {
        throw new Error('Network response was not ok');
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
  return fetch('/api/create-a-tribe')
    .then(response => {
      if (!response.ok) {
        throw new Error('Network response was not ok');
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
  console.log("getMessages::tribeUrl => ", tribeUrl);
  return fetch(`/api/get-chatroom-messages?tribeUrl=${encodeURIComponent(tribeUrl)}`)
    .then(response => {
      if (!response.ok) {
        throw new Error('Network response was not ok');
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

export {
  getTribes,
  createTribe,
  getMessages,
};
