const axios = require("axios");
const { Log } = require("../../logging_middleware");
const { BASE_URL, authHeaders } = require("../config/api");

async function getDepots() {
  console.log(`[service] Fetching depots from ${BASE_URL}/depots`);
  const res = await axios.get(`${BASE_URL}/depots`, { headers: authHeaders() });
  console.log(`[service] Depots response status: ${res.status}`, res.data);
  await Log("backend", "info", "service", "Fetched depots from evaluation API");
  return res.data.depots;
}

async function getVehicles() {
  console.log(`[service] Fetching vehicles from ${BASE_URL}/vehicles`);
  const res = await axios.get(`${BASE_URL}/vehicles`, { headers: authHeaders() });
  console.log(`[service] Vehicles response status: ${res.status}`, res.data);
  await Log("backend", "info", "service", "Fetched vehicles from evaluation API");
  return res.data.vehicles;
}

/*
  Greedy knapsack: sort tasks by impact-per-hour ratio (descending),
  then pick tasks one by one until the mechanic-hour budget is exhausted.
  This runs in O(n log n) and handles large inputs efficiently.
*/
function scheduleTasks(vehicles, mechanicHours) {
  const sorted = [...vehicles].sort(
    (a, b) => b.Impact / b.Duration - a.Impact / a.Duration
  );

  let remaining = mechanicHours;
  const selected = [];

  for (const task of sorted) {
    if (task.Duration <= remaining) {
      selected.push(task);
      remaining -= task.Duration;
    }
  }

  return {
    selected,
    totalImpact: selected.reduce((sum, t) => sum + t.Impact, 0),
    totalDuration: selected.reduce((sum, t) => sum + t.Duration, 0),
  };
}

async function getScheduleForDepot(depotId) {
  console.log(`[service] Getting schedule for depot ${depotId}`);
  const [depots, vehicles] = await Promise.all([getDepots(), getVehicles()]);

  console.log(`[service] Total depots: ${depots?.length}, Total vehicles: ${vehicles?.length}`);

  const depot = depots.find((d) => d.ID === Number(depotId));
  if (!depot) {
    console.warn(`[service] Depot ${depotId} not found in list:`, depots.map(d => d.ID));
    await Log("backend", "warn", "service", `Depot ${depotId} not found`);
    return null;
  }

  console.log(`[service] Found depot:`, depot);
  const result = scheduleTasks(vehicles, depot.MechanicHours);
  console.log(`[service] Schedule result - selected: ${result.selected.length}, totalImpact: ${result.totalImpact}, totalDuration: ${result.totalDuration}`);
  await Log("backend", "info", "service", `Scheduled ${result.selected.length} tasks for depot ${depotId}`);
  return { depot, ...result };
}

module.exports = { getScheduleForDepot };
