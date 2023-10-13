import { authenticateUser, createUser, getLastTribeLogins, getRandomTribeSuggestions } from "./tribes-db-access";
import { updateAppState } from "./app-state";
import App from "./app";

export default function Welcome() {
  const welcomeContainer = document.createElement('div');
  welcomeContainer.id = 'welcome-container';
  welcomeContainer.className = 'welcome';

  welcomeContainer.innerHTML = `
    <div class="login-container">
      <h1 class="welcome-title">Welcome to Yapp</h1>
      <h3 class="welcome-subtitle">How would you like to proceed?</h3>
      <button type="button" class="login-wrapper-btn">Login</button>
      <button type="button" class="create-account-wrapper-btn">Create Account</button>
      <div class="login-wrapper hide">
        <label for="login-username">
          Username:
        </label>
        <input
          type="text" 
          id="login-username" 
          name="login-username" 
          placeholder="Username..." 
          required
        />
        <label for="login-password">
          Password:
        </label>
        <input 
          type="password" 
          id="login-password" 
          name="login-password" 
          placeholder="Password..." 
          required
        />
        <div class="btn-wrapper">
          <button type="button" class="login-btn">Login</button>
          <button type="button" class="login-cancel-btn">Cancel</button>
        </div>
        <p class="display-error login-error"></p>
      </div>
      <div class="create-account-wrapper hide">
        <label for="create-account-username">
          Username 8-20characters:
        </label>
        <input 
          type="text" 
          id="create-account-username" 
          name="create-account-username" 
          placeholder="Username..." 
          minlength="8"
          maxlength="20"
          required
        />
        <label for="create-account-password">
          Password 12-30characters:
        </label>
        <input
          type="password" 
          id="create-account-password" 
          name="create-account-password" 
          placeholder="Password..." 
          minlength="12"
          maxlength="30"
          required
        />
        <div class="btn-wrapper">
          <button type="button" class="create-account-btn">Create Account</button>
          <button type="button" class="create-account-cancel-btn">Cancel</button>
        </div>
        <p class="display-error create-account-error"></p>
      </div>
    </div>
  `;
  
  const loginContainer = welcomeContainer.querySelector('.login-container');

  const loginWrapper = welcomeContainer.querySelector('.login-wrapper');
  const createAccountWrapper = welcomeContainer.querySelector('.create-account-wrapper');

  const loginWrapperBtn = welcomeContainer.querySelector('.login-wrapper-btn');
  const createAccountWrapperBtn = welcomeContainer.querySelector('.create-account-wrapper-btn');

  loginWrapperBtn.addEventListener('click', () => {
    loginContainer.classList.add('login-expanded');
    loginWrapper.style.display = 'flex';
    loginWrapper.classList.remove('hide');
    loginWrapperBtn.classList.add('hide');
    createAccountWrapperBtn.classList.add('hide');
  });

  createAccountWrapperBtn.addEventListener('click', () => {
    loginContainer.classList.add('create-account-expanded');
    createAccountWrapper.style.display = 'flex';
    createAccountWrapper.classList.remove('hide');
    loginWrapperBtn.classList.add('hide');
    createAccountWrapperBtn.classList.add('hide');
  });

  const loginBtn = welcomeContainer.querySelector('.login-btn');
  const loginUsername = welcomeContainer.querySelector('#login-username');
  const loginPassword = welcomeContainer.querySelector('#login-password');
  const displayLoginError = welcomeContainer.querySelector('.login-error');

  loginBtn.addEventListener('click', async() => {
    const username = loginUsername.value;
    const password = loginPassword.value;
  
    try {
      const authenticated = await authenticateUser(username, password);

      if (authenticated) {
        displayLoginError.textContent = '';
        history.pushState(null, null, '/dashboard');
        document.body.removeChild(welcomeContainer);

        updateAppState('username', username);
        updateAppState('userId', authenticated.userId);
        console.log("authenticated.userColor => ", authenticated.userColor);
        updateAppState('userColor', authenticated.userColor);

        const lastTribeLogins = await getLastTribeLogins();
        updateAppState('header-tribe-suggestions', lastTribeLogins);

        const app = await App();
        document.body.appendChild(app);
      } else {
        displayLoginError.textContent = 'Incorrect username or password.';
      }
    } catch (error) {
      displayLoginError.textContent = error;
    }
  });

  const createAccountBtn = welcomeContainer.querySelector('.create-account-btn');
  const createAccountUsername = welcomeContainer.querySelector('#create-account-username');
  const createAccountPassword = welcomeContainer.querySelector('#create-account-password');
  const displayCreateAccountError = welcomeContainer.querySelector('.create-account-error');

  createAccountBtn.addEventListener('click', async () => {
    const username = createAccountUsername.value;
    const password = createAccountPassword.value;
    const joined = new Date().toISOString();
    const userColor = Math.floor(Math.random() * 360);

    try {
      const { userId } = await createUser(username, password, joined, userColor);
      displayCreateAccountError.textContent = '';      
      history.pushState(null, null, '/dashboard');
      const randomTribeSuggestions = await getRandomTribeSuggestions();
      updateAppState('header-tribe-suggestions', randomTribeSuggestions);
      updateAppState('username', username);
      updateAppState('userId', userId);
      updateAppState('userColor', userColor);

      document.body.removeChild(welcomeContainer);
      const app = await App();
      document.body.appendChild(app);
    } catch (error) {
      console.error(error);
      displayCreateAccountError.textContent = error;      
    }
  });

  const loginCancelBtn = welcomeContainer.querySelector('.login-cancel-btn');

  loginCancelBtn.addEventListener('click', () => {
    loginContainer.classList.remove('login-expanded');
    loginWrapperBtn.classList.remove('hide');
    createAccountWrapperBtn.classList.remove('hide');
    loginWrapper.classList.add('hide');

    setTimeout(() => {
      loginWrapper.style.display = 'none';
    }, 300);
  });

  const createAccountCancelBtn = welcomeContainer.querySelector('.create-account-cancel-btn');

  createAccountCancelBtn.addEventListener('click', () => {
    loginContainer.classList.remove('create-account-expanded');
    loginWrapperBtn.classList.remove('hide');
    createAccountWrapperBtn.classList.remove('hide');
    createAccountWrapper.classList.add('hide');

    setTimeout(() => {
      createAccountWrapper.style.display = 'none';
    }, 300);
  });
  
  return welcomeContainer;
}
