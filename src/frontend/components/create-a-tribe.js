const url = process.env.SERVER_URL;

function handlePostTribe(form) {
  form.addEventListener('submit', (event) => {
    event.preventDefault();

    const formData = new FormData(form);
    const tribeData = Object.fromEntries(formData.entries());
    const formationDate = new Date().toISOString().slice(0, 10);

    const valuesArr = [tribeData.tribeName, tribeData.tribeCta, tribeData.tribeDescription, formationDate]; 

    fetch('/api/create-a-tribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(valuesArr),
    })
      .then((response) => {
        console.log("setPostTribe::response => ", response);
        response.json();
      })
      .then((data) => {
        console.log('Success:', data);
      })
      .catch((error) => {
        console.error('Error:', error);
      });
  });
}

export default function CreateTribe() {
  const createTribeContainer = document.createElement('div');
  createTribeContainer.id = 'create-tribe-container';
  createTribeContainer.className = 'removable';

  createTribeContainer.innerHTML = `
    <div class="create-tribe-inner-container">
      <h1 class="create-tribe-title">Create Your Own Tribe</h1>
      <form action="${url}/api/create-a-tribe" id="create-tribe-form" method="POST">
        <label for="tribeName">
          Tribe Name:
          <input class="create-tribe-input" name="tribeName" type="text" maxLength="50" required/>
        </label> 
        <label for="tribeCta">
          Explain why people might want to join your tribe.
          <input class="create-tribe-input" name="tribeCta" type="text" maxLength="50" required/>
        </label> 
        <label for="tribeDescription">
          Write a short description explaining what your tribe is about.
          <textarea class="create-tribe-input" name="tribeDescription" maxLength="150" required></textarea>
        </label> 
        <input type="submit" value="Submit"/>
      </form> 
    </div>
  `;

  const form = createTribeContainer.querySelector('#create-tribe-form');

  handlePostTribe(form);

  return createTribeContainer;
}
