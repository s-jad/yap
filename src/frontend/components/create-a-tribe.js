import '../styles/create-a-tribe.css';

const url = process.env.SERVER_URL;

function handleCreateTribe(form) {
  form.addEventListener('submit', (event) => {
    event.preventDefault();

    const formData = new FormData(form);
    const tribeData = Object.fromEntries(formData.entries());
    const formationDate = new Date().toISOString().slice(0, 10);

    const valuesArr = [tribeData.tribeName, tribeData.tribeCta, tribeData.tribeDescription, formationDate]; 

    fetch('/api/protected/create-a-tribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(valuesArr),
    })
      .then((response) => {
        response.json();
      })
      .then((data) => {
        console.log('handlePostTribe::Success:', data);
      })
      .catch((error) => {
        console.error('handlePostTribe::Error:', error);
      });
  });
}

export default function CreateTribe() {
  const createTribeContainer = document.createElement('div');
  createTribeContainer.id = 'create-tribe-container';
  createTribeContainer.className = 'yapp-form-container removable';

  createTribeContainer.innerHTML = `
      <h1 class="form-title">Create Your Own Tribe</h1>
      <form action="${url}/api/create-a-tribe" id="create-tribe-form" method="POST" class="yapp-form">
        <div class="form-border">
          <label for="tribeName">Tribe Name:</label> 
          <input class="create-tribe-input" name="tribeName" type="text" maxLength="50" required/>
          <label for="tribeCta">Explain why people might want to join your tribe.</label> 
          <input class="create-tribe-input" name="tribeCta" type="text" maxLength="50" required/>
          <label for="tribeDescription">Write a short description explaining what your tribe is about.</label> 
          <textarea class="create-tribe-input" name="tribeDescription" maxLength="150" required></textarea>
        </div>
        <input class="form-input-submit" type="submit" id="submit-new-tribe" value="Submit"/>
      </form> 
  `;

  const form = createTribeContainer.querySelector('#create-tribe-form');

  handleCreateTribe(form);

  return createTribeContainer;
}
