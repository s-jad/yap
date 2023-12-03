import '../styles/admin-dashboard.css';
import { getMonthlyLoginStats, getUserActivityStats } from './tribes-db-access';
import * as d3 from 'd3';

function clearPreviousChart(container) {
  const svg = container.querySelector('svg');

  if (svg !== null) {
    container.removeChild(svg);
  }
}

function renderUserActivityChartByUser(userActivityData, userName) {
  const userActivtyContainer = document.body.querySelector('.stats-container.user-activity');
  clearPreviousChart(userActivtyContainer);

  const rect = userActivtyContainer.getBoundingClientRect();
  const keysArr = Object.keys(userActivityData);
  const valuesArr = Object.values(userActivityData);

  const yMax = Math.max(...valuesArr);

  const margin = {top: 120, right: 30, bottom: 30, left: 30},
    height = rect.height - margin.top - margin.bottom,
    width = rect.width - margin.left - margin.right;
  
  console.log("height => ", height);

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
    .domain(keysArr);

  const yScale = d3.scaleLinear()
    .range([height, 0])
    .domain([0, yMax]);

  svg.append('text')
    .attr('x', width / 5)
    .attr('y', -20)
    .attr('text-anchor', 'middle')
    .style('font-size', '1.6rem')
    .style('fill', '#dec4e3')
    .text(userName); 

  svg.append('g')
    .attr('transform', 'translate(0,' + height + ')')
    .call(d3.axisBottom(xScale))
    .selectAll('text')
      .attr('transform', 'translate(-10,0)')
      .style('text-anchor', 'center');

  svg.append('g')
    .call(d3.axisLeft(yScale));

  svg.selectAll('.bar')
    .data(valuesArr)
    .enter()
    .append('rect')
      .attr('x', function(d, i) { return  xScale(keysArr[i]) })
      .attr('y', function (d) { return yScale(d) })
      .attr('width', xScale.bandwidth())
      .attr('height', function(d) { return height - yScale(d); })
      .attr('fill', '#dec4e3')
}

function renderUserActivityChartByCategory(userActivityData, category) {
  const userActivtyContainer = document.body.querySelector('.stats-container.user-activity');
  clearPreviousChart(userActivtyContainer);
  const rect = userActivtyContainer.getBoundingClientRect();
  
  const margin = {top: 50, right: 30, bottom: 30, left: 40},
    height = rect.height - margin.top - margin.bottom,
    width = rect.width - margin.left - margin.right;

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
    .domain([0, d3.max(userActivityData, function(d) { return d[category]; })]);

  svg.append('text')
    .attr('x', width / 5)
    .attr('y', -20)
    .attr('text-anchor', 'middle')
    .style('font-size', '1.6rem')
    .style('fill', '#dec4e3')
    .text(`${category}`); 

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
      .attr('y', function(d) { return yScale(d[category]); })
      .attr('width', xScale.bandwidth())
      .attr('height', function(d) { return height - yScale(d[category]); })
      .attr('fill', '#dec4e3')
}

function renderMonthlyLoginChart(monthlyLoginData) {
  console.log("monthlyLoginData => ", monthlyLoginData);
}

function filterUser(arr, userToInclude) {
  return arr.find((user) => {
    return user.user_name === userToInclude;
  });
}

function filterCategory(arr, category) {
  const filteredArr = [];
  arr.forEach((user) => {
    const filteredUser = Object.entries(user).reduce((acc, [key, value]) => {
      if (
        key === category
        || key === 'user_id'
        || key === 'user_name'
      ) {
        acc[key] = value;
      }
      return acc;
    }, {});
    filteredArr.push(filteredUser);
  });

  return filteredArr;
}

function filterUserActivityInterface(userActivityData, filterType, filterScheme) {
  let filteredData
  switch (filterType) {
    case 'user':
      filteredData = filterUser(userActivityData, filterScheme);
      console.log("filteredData => ", filteredData);
      const userName = filteredData.user_name;
      delete filteredData.user_name;
      delete filteredData.user_id;
      renderUserActivityChartByUser(filteredData, userName);
      break;

    case 'category':
      filteredData = filterCategory(userActivityData, filterScheme);
      renderUserActivityChartByCategory(filteredData, filterScheme);
      break;

    case 'totals':
      
      break;

    default:
      break;
  }

  return filteredData;
}

function getUserActivityFilterOptions(userActivityData, container, btnValue) {
  const filterOptionsWrapper = document.createElement('div');
  filterOptionsWrapper.className = 'filter-options-wrapper';
  const filterOptionsInner = document.createElement('div');
  filterOptionsInner.className = 'filter-options-inner';
  filterOptionsWrapper.appendChild(filterOptionsInner);

  switch (btnValue) {
    case 'user':
      const userSearch = document.createElement('input');
      userSearch.type = 'text';
      userSearch.className = 'user-search-input';
      userSearch.placeholder = 'User to analyze...';
      const generateChartBtn = document.createElement('button');
      generateChartBtn.className = 'generate-chart-btn';
      generateChartBtn.textContent = 'Generate';
      generateChartBtn.addEventListener(('click'), () => {
        if (userSearch.value !== undefined) {
          const user = userSearch.value;
          filterUserActivityInterface(userActivityData, 'user', user);
        }
      });
      filterOptionsInner.appendChild(userSearch);
      filterOptionsInner.appendChild(generateChartBtn);
      container.appendChild(filterOptionsWrapper);
      break;
    case 'category':
      filterOptionsInner.innerHTML = `
        <div class="filter-category-options-wrapper">
          <label for="filter-option-tims">
            Total inbox Messages Sent
            <input 
              id="filter-option-tims"
              type="radio" 
              class="filter-option-radio-btn"
              name="filter-category-options"
              value="total_inbox_messages_sent"
            />
          </label>
          <label for="filter-option-tims">
            Total inbox messages received 
            <input 
              id="filter-option-tims"
              type="radio" 
              class="filter-option-radio-btn"
              name="filter-category-options"
              value="total_inbox_messages_received"
            />
          </label>
          <label for="filter-option-tcms">
            Total chat messages sent
            <input 
              id="filter-option-tcms"
              type="radio" 
              class="filter-option-radio-btn"
              name="filter-category-options"
              value="total_chat_messages_sent"
            />
          </label>
          <label for="filter-option-tcmr">
            Total chat messages received
            <input 
              id="filter-option-tcmr"
              type="radio" 
              class="filter-option-radio-btn"
              name="filter-category-options"
              value="total_chat_messages_received"
            />
          </label>
        </div>
      `;
      const generateCategoryChartBtn = document.createElement('button');
      generateCategoryChartBtn.className = 'generate-chart-btn';
      generateCategoryChartBtn.textContent = 'Generate';
      generateCategoryChartBtn.addEventListener(('click'), () => {
        const checked = filterOptionsInner.querySelector('input[type="radio"]:checked');
        if (checked !== undefined) {
          const category = checked.value;
          filterUserActivityInterface(userActivityData, 'category', category);
        }
      });
      filterOptionsInner.appendChild(generateCategoryChartBtn);
      container.appendChild(filterOptionsWrapper);
      break;
    case 'totals':
      
      break;

    default:
      break;
  }
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
      getUserActivityFilterOptions(userActivityStats, containers[0], btn.value);
    });
  });

  return admin;
}
