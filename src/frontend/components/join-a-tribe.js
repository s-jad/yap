import '../styles/join-tribe.css';

export default function JoinTribe() {
  const joinTribeContainer = document.createElement('div');
  joinTribeContainer.id = 'join-tribe-container';
  joinTribeContainer.className = 'removable';


  joinTribeContainer.innerHTML = `
    <div class="tribe-grid">

      <a class="tribe-link" href="#" tabindex="1">
        <div class="tribe-card">
          <div class="tribe-card-upper-flex">
            <h2 class="tribe-name">House Music Lovers</h2>
            <img class="tribe-icon" alt="Tribal Icon">
          </div>
          <h3 class="tribe-cta">Dance til you drop</h3>
          <p class="tribe-description">For those of us who can't get enough chicago house</p>
        </div>
      </a>

      <a class="tribe-link" href="#" tabindex="2">
        <div class="tribe-card">
          <div class="tribe-card-upper-flex">
            <h2 class="tribe-name">Animal Collective</h2>
            <img class="tribe-icon" alt="Tribal Icon">
          </div>
          <h3 class="tribe-cta">Can't get enuff fluff!!</h3>
          <p class="tribe-description">For all of your adorable animal needs, care tips and funny stories</p>
        </div>
      </a>

      <a class="tribe-link" href="#" tabindex="3">
        <div class="tribe-card">
          <div class="tribe-card-upper-flex">
            <h2 class="tribe-name">Politics</h2>
            <img class="tribe-icon" alt="Tribal Icon">
          </div>
          <h3 class="tribe-cta">Well someone has to talk about it</h3>
          <p class="tribe-description">Current news, international stories and political analysis</p>
        </div>
      </a>

      <a class="tribe-link" href="#" tabindex="4">
        <div class="tribe-card">
          <div class="tribe-card-upper-flex">
            <h2 class="tribe-name">Football Family</h2>
            <img class="tribe-icon" alt="Tribal Icon">
          </div>
          <h3 class="tribe-cta">The beautiful game</h3>
          <p class="tribe-description">For current sports news, stats, match updates and general banter!</p>
        </div>
      </a>

      <a class="tribe-link" href="#" tabindex="5">
        <div class="tribe-card">
          <div class="tribe-card-upper-flex">
            <h2 class="tribe-name">The Office</h2>
            <img class="tribe-icon" alt="Tribal Icon">
          </div>
          <h3 class="tribe-cta">Based out of beautiful Scranton, Pennsylvania</h3>
          <p class="tribe-description">Some office quote I cant remember</p>
        </div>
      </a>

      <a class="tribe-link" href="#" tabindex="6">
        <div class="tribe-card">
          <div class="tribe-card-upper-flex">
            <h2 class="tribe-name">Classic Book Club</h2>
            <img class="tribe-icon" alt="Tribal Icon">
          </div>
          <h3 class="tribe-cta">A classic is a book everyone wants to read, but nobody wants to have read</h3>
          <p class="tribe-description">Discussing antique literature, classics and modern classics</p>
        </div>
      </a>

    </div>
  `;

  const tribeCardLinks = Array.from(joinTribeContainer.querySelectorAll('.tribe-link'));

  tribeCardLinks.forEach((link) => {
    link.addEventListener('click', (ev) => {
      ev.preventDefault();
      const link = ev.target;
      console.log('clicked on tribe card => ', link);
    });
  });

  return joinTribeContainer;
}
