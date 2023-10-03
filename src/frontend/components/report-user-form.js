function addUserBtnEvent(addUserBtn, addUserInput, involvedUserList) {

  addUserBtn.addEventListener('click', () => {
    const userName = addUserInput.value;
    involvedUserList.insertAdjacentHTML('beforeend', `<p>${userName}</p>`);
    addUserInput.value = '';
    addUserInput.focus();
  });
}

export default function ReportUserIncidentForm() {
  const reportFormContainer = document.createElement('div');
  reportFormContainer.id = 'report-user-issue-form-container';
  reportFormContainer.className = 'removable';

  reportFormContainer.innerHTML = `
   <h1 class="report-title">Report an Issue</h1>
   <form class="report-form">
     <label for="r-description">
       Please provide a detailed description of the incident
       <textarea class="report-form-item report-description" name="r-description"></textarea>
     </label>
      <p class="r-form-info">Choose the mosts relevant category for the incident</p>
      <div class="radio-flex">
        <label for="radio-bullying">
          Bullying
          <input id="radio-bullying" type="radio" class="r-form-radio" name="r-type"
          value="bullying"> 
        </label>
        <label for="radio-hacking">
          Hacking
          <input id="radio-hacking" type="radio" class="r-form-radio" name="r-type"
          value="hacking"> 
        </label>
        <label for="radio-scam">
          Scam
          <input id="radio-scam" type="radio" class="r-form-radio" name="r-type" value="scam"> 
        </label>
      </div>
    <label for="r-select-members">
      If someone was involded, please add their username
      <div class="input-btn-flex">
        <input type="text" id="r-user" name="r-user">
        <button type="button" class="r-form-btn" id="add-user-btn">Add User</button>
      </div>
      <div id="involved-user-list"></div>
    </label>
    <input class="form-submit-input" type="submit" value="Submit report">
   </form>
  `;

  const addUserBtn = reportFormContainer.querySelector('#add-user-btn');
  const addUserInput = reportFormContainer.querySelector('#r-user');
  const involvedUserList = reportFormContainer.querySelector('#involved-user-list');

  addUserBtnEvent(addUserBtn, addUserInput, involvedUserList);

  return reportFormContainer;
}