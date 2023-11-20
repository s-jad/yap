import '../styles/report-user-form.css';
import { showDialog } from './app-state';
import { postUserReport } from './tribes-db-access';

const url = process.env.SERVER_URL;

export default function ReportUserIncidentForm() {
  const reportFormContainer = document.createElement('div');
  reportFormContainer.id = 'report-user-issue-form-container';
  reportFormContainer.className = 'yapp-form-container removable';

  reportFormContainer.innerHTML = `
   <h1 class="report-title">Report an Issue</h1>
   <form action="${url}/report-user-issue" method="POST" class="yapp-form">
    <div class="form-border">
       <label for="r-description">
         Please provide a detailed description of the incident
         <textarea id="r-description" class="report-form-item report-description" name="incidentDescription"></textarea>
       </label>
        <div class="radio-outer-flex">
          <p class="r-form-info">Choose the most relevant category for the incident</p>
          <div class="radio-flex">
            <label for="radio-bullying">
              Bullying
              <input id="radio-bullying" type="radio" class="r-form-radio" name="incidentType"
            value="bullying" /> 
            </label>
            <label for="radio-hacking">
              Hacking
              <input id="radio-hacking" type="radio" class="r-form-radio" name="incidentType"
            value="hacking" /> 
            </label>
            <label for="radio-scam">
              Scam
              <input id="radio-scam" type="radio" class="r-form-radio" name="incidentType"
            value="scam" /> 
            </label>
         </div>
      </div>
      <label for="r-users">
        Please enter the involed members usernames, seperate by a comma
        <div class="input-btn-flex">
          <input type="text" id="r-users" name="involvedUsers" placeholder="Member1, Member2, Member3..." />
        </div>
      </label>
    </div>
    <input class="form-submit-input" type="submit" value="Submit report">
   </form>
  `;

  const formSubmitInput = reportFormContainer.querySelector('.form-submit-input');

  formSubmitInput.addEventListener('click', async (ev) => {
    ev.preventDefault();
  
    const formData = new FormData(reportFormContainer.querySelector('.yapp-form'));
    
    const result = await postUserReport(formData);
    
    if (result.rowCount > 0) {
      showDialog(
        reportFormContainer,
        'Report sent!',
        'report-msg-success',
        'success',
        'center',
      );
    } else {
      showDialog(
        reportFormContainer,
        `Something went wrong,
        please check if you input the correct usernames`,
        'report-failure',
        'fail',
        'center',
      );
    }
  });

  return reportFormContainer;
}
