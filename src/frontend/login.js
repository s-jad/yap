import './reset.css';
import './variables.css';
import './styles/general-form-styling.css';
import './styles/welcome.css';
import './styles/app.css';
import './styles/header.css';
import './styles/dashboard.css';
import './styles/sidebar.css';
import './styles/hamburger-btn.css';
import Welcome from './components/welcome';

const welcomeScreen = Welcome();
history.pushState(null, null, '/');
document.body.appendChild(welcomeScreen);
