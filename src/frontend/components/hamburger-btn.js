export default function HamburgerBtn() {
  const btnContainer = document.createElement('div');
  btnContainer.classList.add('btn-container');

  const invisibleHideBtn = document.createElement('button');
  invisibleHideBtn.classList.add('invisible-btn');

  const hamburgerBtn = document.createElement('div');
  hamburgerBtn.classList.add('hamburger-btn');
  hamburgerBtn.innerHTML = `
    <div class="hamburger-btn-line line-one collapse"></div>
    <div class="hamburger-btn-line line-two collapse"></div>
    <div class="hamburger-btn-line line-three collapse"></div>
  `;

  const hamburgerLines = Array.from(hamburgerBtn.querySelectorAll('.hamburger-btn-line'));

  btnContainer.appendChild(invisibleHideBtn);
  btnContainer.appendChild(hamburgerBtn);

  const hide = function hideBtnContainer() {
    const container = this.parentNode.parentNode;
    container.classList.toggle('hide');
    btnContainer.classList.toggle('hamburger');

    const hideableContent = Array.from(container.querySelectorAll('.hideable'));
    hideableContent.forEach((el) => el.classList.toggle('hide'));

    hamburgerLines.forEach((line) => line.classList.toggle('collapse'));
  };

  invisibleHideBtn.onclick = hide;

  return btnContainer;
}
