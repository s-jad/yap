import '../styles/create-a-tribe.css';
import { handleCreateTribe } from './fetch_apis';

const url = process.env.SERVER_URL;

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
