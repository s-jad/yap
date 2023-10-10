import { authenticateUser } from "./tribes-db-access";
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
        <button type="button" class="login-btn">Login</button>
        <button type="button" class="login-cancel-btn">Cancel</button>
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
        <button type="button" class="create-account-btn">Create Account</button>
        <button type="button" class="create-account-cancel-btn">Cancel</button>
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

  loginBtn.addEventListener('click', async() => {
    const username = loginUsername.value;
    const password = loginPassword.value;

    const authenticated = await authenticateUser(username, password);
    if (authenticated) {
      history.pushState(null, null, '/dashboard');
      document.body.removeChild(welcomeContainer);
      const app = await App();
      document.body.appendChild(app);
    } else {
      console.log("Wrong password");
    }
  });

  const createAccountBtn = welcomeContainer.querySelector('.create-account-btn');
  const createAccountUsername = welcomeContainer.querySelector('#create-account-username');
  const createAccountPassword = welcomeContainer.querySelector('#create-account-password');

  createAccountBtn.addEventListener('click', () => {
    const username = createAccountUsername.value;
    const password = createAccountPassword.value;
    console.log("hi, ", username, password);
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
