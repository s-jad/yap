import Header from './header';
import Dashboard from './dashboard';
import Sidebar from './sidebar';

export default function App() {
  const appContainer = document.createElement('div');
  appContainer.classList.add('app-container');

  appContainer.appendChild(Header());
  appContainer.appendChild(Dashboard());
  appContainer.appendChild(Sidebar());

  return appContainer;
}
