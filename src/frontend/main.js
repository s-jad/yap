import './reset.css';
import './variables.css';
import './styles/general-form-styling.css';
import './styles/welcome.css';
import './styles/app.css';
import './styles/header.css';
import './styles/dashboard.css';
import './styles/sidebar.css';
import './styles/hamburger-btn.css';
import './styles/modal.css';
import App from './components/app';

const app = await App();
document.body.appendChild(app);
