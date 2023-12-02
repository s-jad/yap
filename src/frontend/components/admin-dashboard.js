import '../styles/admin-dashboard.css';
import { getMonthlyLoginStats, getUserActivityStats } from './tribes-db-access';
import * as d3 from 'd3';
import { getModal } from './modals';

let currentFilterValues = [];

function getUserActivityFilterModal(value) {
  const {
    modal,
    modalInner,
    headers
  } = getModal();

  modalInner.classList.add('ua-filter-modal');

  modalInner.innerHTML = `
    <div class="filter-message-type">
      <div class="chatroom-messages">
        <h3>Total chatroom messages: </h3>
        <label for="tims">
          Sent:
          <input 
            type="checkbox"
            id="timr"
            value="total_chatroom_messages_sent"
          />
        </label>
        <label for="timr">
          Received:
          <input 
            type="checkbox"
            id="timr"
            value="total_chatroom_messages_received"
          />
        </label>
      </div>
      <div class="inbox-messages">
        <h3>Total inbox messages: </h3>
        <label for="tims">
          Sent:
          <input 
            type="checkbox"
            id="timr"
            value="total_inbox_messages_sent"
          />
        </label>
        <label for="timr">
          Received:
          <input 
            type="checkbox"
            id="timr"
            value="total_inbox_messages_received"
          />
        </label>
      </div>
    </div>
    <button class="filter-btn">Filter</button>
    <button class="cancel-btn">Cancel</button>
  `;

  const filterBtn = modalInner.querySelector('.filter-btn');

  filterBtn.addEventListener(('click'), () => {
    const checkboxes = Array.from(modalInner.querySelectorAll('input[type="checkbox"]'));
    const filterValues = [];
    checkboxes.forEach((checkbox) => {
      filterValues.push(checkbox.value);
    });
    currentFilterValues = newValues;
    document.body.removeChild(modal);
  });

  cancelBtn.addEventListener(('click'), () => {
    document.body.removeChild(modal);
  });

  const cancelBtn = modalInner.querySelector('.cancel-btn');

  document.body.appendChild(modal);
}

function renderUserActivityChart(userActivityData) {
  const userActivtyContainer = document.body.querySelector('.stats-container.user-activity');
  const rect = userActivtyContainer.getBoundingClientRect();
  
  const margin = {top: 50, right: 30, bottom: 30, left: 40},
    height = rect.height - margin.top - margin.bottom,
    width = rect.width - margin.left - margin.right;
  
  console.log("height => ", height);
  console.log("width => ", width);

  const svg = d3.select(userActivtyContainer)
    .append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
    .append('g')
      .attr('transform',
            'translate(' + margin.left + ',' + margin.top + ')');

  const xScale = d3.scaleBand()
    .range([0, width])
    .padding(0.2)
    .domain(userActivityData.map(function(d) { return d.user_id; }));

  const yScale = d3.scaleLinear()
    .range([height, 0])
    .domain([0, d3.max(userActivityData, function(d) { return d.total_chat_messages_sent; })]);
  
  svg.append('g')
    .attr('transform', 'translate(0,' + height + ')')
    .call(d3.axisBottom(xScale))
    .selectAll('text')
      .attr('transform', 'translate(-10,0)')
      .style('text-anchor', 'end');

  svg.append('g')
    .call(d3.axisLeft(yScale));

  svg.selectAll('.bar')
    .data(userActivityData)
    .enter()
    .append('rect')
      .attr('x', function(d) { return xScale(d.user_id); })
      .attr('y', function(d) { return yScale(d.total_chat_messages_sent); })
      .attr('width', xScale.bandwidth())
      .attr('height', function(d) { return height - yScale(d.total_chat_messages_sent); })
      .attr('fill', '#dec4e3')
}

function renderMonthlyLoginChart(monthlyLoginData) {
  console.log("monthlyLoginData => ", monthlyLoginData);
}

function filterProps(arr, propsToExclude) {
  return arr.map((obj) => {
    const res = { ...obj };
    propsToExclude.forEach((prop) => delete res[prop]);
    return res;
  });
}

function filterUserActivityInterface(userActivityData, filterType, filterScheme) {
  let filteredData
  switch (filterType) {
    case 'user':

      break;

    case 'category':
      filteredData = filterProps(userActivityData, filterScheme);
      break;

    case 'totals':
      
      break;

    default:
      break;
  }

  return filteredData;
}

export default async function AdminDashboard() {
  const admin = document.createElement('div');
  admin.className = 'admin-dashboard removable';

  admin.innerHTML = `
    <div class="admin-dashboard-view-switch">
      <label for="view-stats">
        Statistics
        <input 
          id="view-stats"
          type="radio" 
          class="view-radio-btn"
          name="switch-dashboard-view"
          value="statistics"
          checked
        />
      </label>
      <label for="view-actions-grid">
        Actions
        <input 
          id="view-actions-grid"
          type="radio" 
          class="view-radio-btn"
          name="switch-dashboard-view"
          value="actions"
        />
      </label>
    </div>
    <div class="admin-functions-grid">
      <div class="admin-function-card notify-users">
        <h3>Notify Users</h3>
      </div>
      <div class="admin-function-card block-users">
        <h3>Block Users</h3>
      </div>
      <div class="admin-function-card unblock-users">
        <h3>Unblock Users</h3>
        </div>
      <div class="admin-function-card user-reports">
        <h3>User Reports</h3>
      </div>
    </div>
    <div class="user-stats-dashboard">
      <div class="stats-headers-wrapper">
        <h3 class="user-activity-header displayed">User Activity</h3> 
        <h3 class="login-stats-header">Login Stats</h3> 
        <h3 class="misc-stats-header">Misc. Stats</h3> 
      </div>
      
      <div class="stats-cards-wrapper">
        <div class="stats-card user-activity">
          <div class="stats-container user-activity">
            <div class="filter-btn-wrapper">
              <p>Filter by: </p>
              <label for"ua-user">
                UserId
                <input 
                  id="ua-user"
                  type="radio" 
                  class="ua-radio-btn"
                  name="filter-user-activity"
                  value="user"
                  checked
                />
              </label>
              <label for="ua-category">
                Category
                <input 
                  id="ua-category"
                  type="radio" 
                  class="ua-radio-btn"
                  name="filter-user-activity"
                  value="category"
                />
              </label>
              <label for="ua-totals">
                Totals
                <input 
                  id="ua-totals"
                  type="radio" 
                  class="ua-radio-btn"
                  name="filter-user-activity"
                  value="totals"
                />
              </label>
            </div>
          </div>
        </div>

        <div class="stats-card login-stats hidden">
          <div class="stats-container login-stats"></div>
        </div>

        <div class="stats-card misc-stats hidden">
          <div class="stats-container misc-stats"></div>
        </div>
      </div>
    </div>
  `;
  
  const viewActionsGrid = admin.querySelector('[for="view-actions-grid"]');
  const viewStats = admin.querySelector('[for="view-stats"]');

  viewActionsGrid.addEventListener(('click'), () => {
    admin.classList.add('actions');
  });

  viewStats.addEventListener(('click'), () => {
    admin.classList.remove('actions');
  });

  const headers = Array.from(admin.querySelectorAll('[class*="header"]:not([class*="headers"])'));
  const containers = Array.from(admin.querySelectorAll('.stats-container'));
  const cards = Array.from(admin.querySelectorAll('.stats-card'));
  const userActivityStats = await getUserActivityStats();
  const monthlyLoginStats = await getMonthlyLoginStats();
  //  const miscStats = await getMiscStats();

  headers.forEach((header, index) => {
    header.addEventListener(('click'), () => {
      const currentlyDisplayedCard = admin.querySelector('.stats-card:not(.hidden)');
      const currentlyDisplayedHeader = admin.querySelector('.displayed');
      if (currentlyDisplayedHeader === header) {
        return;
      }
      currentlyDisplayedHeader.classList.remove('displayed');
      cards[index].classList.remove('hidden');
      currentlyDisplayedCard.classList.add('hidden');
      header.classList.add('displayed');
    });
  });

  const userActivityFilterBtns = Array.from(admin.querySelectorAll('.ua-radio-btn'));
  
  userActivityFilterBtns.forEach((btn) => {
    btn.addEventListener(('click'), () => {
      getUserActivityFilterModal(btn.value);
    });
  });

  setTimeout(() => {
    renderUserActivityChart(userActivityStats, containers[0]);
    renderMonthlyLoginChart(monthlyLoginStats, containers[1]);
    renderMonthlyLoginChart(monthlyLoginStats, containers[2]);
  }, 1000);

  return admin;
}
