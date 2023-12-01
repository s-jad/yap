import '../styles/admin-dashboard.css';
import { getMonthlyLoginStats, getUserActivityStats } from './tribes-db-access';
import * as d3 from 'd3';

function renderUserActivityChart(userActivityData) {
  const userActivtyContainer = document.body.querySelector('.stats-container.user-activity');
  const rect = userActivtyContainer.getBoundingClientRect();

  const margin = {top: 30, right: 30, bottom: 70, left: 60},
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
    .domain(userActivityData.map(function(d, i) { return d.user_id; }));

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
      .attr('x', function(d) { return xScale(d.chat_sender_id); })
      .attr('y', function(d) { return yScale(d.total_chat_messages_sent); })
      .attr('width', xScale.bandwidth())
      .attr('height', function(d) { return height - yScale(d.total_chat_messages_sent); })
      .attr('fill', '#dec4e3')
}

function renderMonthlyLoginChart(monthlyLoginData) {
  console.log("monthlyLoginData => ", monthlyLoginData);
}

export default async function AdminDashboard() {
  const admin = document.createElement('div');
  admin.className = 'admin-dashboard removable';

  admin.innerHTML = `
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
          <div class="stats-container user-activity"></div>
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

  setTimeout(() => {
    renderUserActivityChart(userActivityStats, containers[0]);
    renderMonthlyLoginChart(monthlyLoginStats, containers[1]);
    renderMonthlyLoginChart(monthlyLoginStats, containers[2]);
  }, 1000);

  return admin;
}
