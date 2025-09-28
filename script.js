let bioThreshold = 80, nonBioThreshold = 80, hazThreshold = 80;
let bioFill = 0, nonBioFill = 0, hazFill = 0;
let bioHistory = [], nonBioHistory = [], hazHistory = [];
let bioItems = {}, nonBioItems = {}, hazItems = {};
let bioPage = 1, nonBioPage = 1, hazPage = 1;
const rowsPerPage = 5;

// Categories & contributions (affects fill)
const itemCategories = {
  Organic: { bin: "bio", emoji: "🍌" },
  Paper: { bin: "bio", emoji: "📦" },
  Plastic: { bin: "nonBio", emoji: "🥤" },
  Metal: { bin: "nonBio", emoji: "🥫" },
  Glass: { bin: "nonBio", emoji: "🍾" },
  Battery: { bin: "haz", emoji: "🔋" },
  Chemicals: { bin: "haz", emoji: "☠️" }
};
const itemContributions = { Plastic: 5, Organic: 7, Paper: 3, Metal: 6, Glass: 8, Battery: 10, Chemicals: 12 };
const sampleItems = Object.keys(itemCategories);

// DOM wiring for thresholds
document.getElementById("bioThreshold").addEventListener("input", e => bioThreshold = parseInt(e.target.value) || 80);
document.getElementById("nonBioThreshold").addEventListener("input", e => nonBioThreshold = parseInt(e.target.value) || 80);
document.getElementById("hazThreshold").addEventListener("input", e => hazThreshold = parseInt(e.target.value) || 80);

// Machine toggle & sample solar ping
const toggleMachine = document.getElementById("toggleMachine");
toggleMachine.addEventListener("click", () => {
  const st = document.getElementById("machineStatus");
  if (st.classList.contains("status-on")) {
    st.classList.remove("status-on"); st.classList.add("status-off"); st.textContent = "OFF";
  } else {
    st.classList.remove("status-off"); st.classList.add("status-on"); st.textContent = "ON";
  }
  document.getElementById("lastPing").textContent = new Date().toLocaleTimeString();
});

// Emoji display
function showEmoji(emoji) {
  const log = document.getElementById("emojiLog");
  log.innerHTML = `<span>${emoji}</span>`;
  // fade out after 3s
  setTimeout(()=> { log.innerHTML = ""; }, 3000);
}

// Detection simulation
function updateDetection() {
  const item = sampleItems[Math.floor(Math.random() * sampleItems.length)];
  const category = itemCategories[item];
  document.getElementById("detectionPreview").innerText = "Detected: " + item;
  showEmoji(category.emoji);
  updateBin(category.bin, item);
  // update solar random tiny variance
  const powerElem = document.getElementById("solarPower");
  const cur = 150 + Math.floor(Math.random()*80);
  powerElem.textContent = `${cur}W`;
}

function updateBin(bin, item) {
  let fill, history, items, fillElem, alertElem,
      avgElem, timeElem, topElem, trendChart, pieChart, pageElem, page;

  if (bin === "bio") {
    bioFill += itemContributions[item]; if (bioFill > 100) bioFill = 100;
    fill = bioFill; history = bioHistory; items = bioItems; page = bioPage;
    fillElem = document.getElementById("bioFillLevel"); alertElem = document.getElementById("bioAlert");
    avgElem = document.getElementById("bioAvgFill"); timeElem = document.getElementById("bioTimeToFull");
    topElem = document.getElementById("bioTopItem"); trendChart = bioTrendChart; pieChart = bioPieChart; pageElem = document.getElementById("bioPageNum");
    addHistoryRow("bioHistory", item, bioFill);
  } else if (bin === "nonBio") {
    nonBioFill += itemContributions[item]; if (nonBioFill > 100) nonBioFill = 100;
    fill = nonBioFill; history = nonBioHistory; items = nonBioItems; page = nonBioPage;
    fillElem = document.getElementById("nonBioFillLevel"); alertElem = document.getElementById("nonBioAlert");
    avgElem = document.getElementById("nonBioAvgFill"); timeElem = document.getElementById("nonBioTimeToFull");
    topElem = document.getElementById("nonBioTopItem"); trendChart = nonBioTrendChart; pieChart = nonBioPieChart; pageElem = document.getElementById("nonBioPageNum");
    addHistoryRow("nonBioHistory", item, nonBioFill);
  } else {
    hazFill += itemContributions[item]; if (hazFill > 100) hazFill = 100;
    fill = hazFill; history = hazHistory; items = hazItems; page = hazPage;
    fillElem = document.getElementById("hazFillLevel"); alertElem = document.getElementById("hazAlert");
    avgElem = document.getElementById("hazAvgFill"); timeElem = document.getElementById("hazTimeToFull");
    topElem = document.getElementById("hazTopItem"); trendChart = hazTrendChart; pieChart = hazPieChart; pageElem = document.getElementById("hazPageNum");
    addHistoryRow("hazHistory", item, hazFill);
  }

  // animate progress
  fillElem.style.width = `${fill}%`;
  fillElem.innerText = `${fill}%`;

  // history array for stats
  history.push(fill);
  if (history.length > 20) history.shift();

  // track items frequency
  items[item] = (items[item] || 0) + 1;

  // average
  const avg = (history.reduce((a,b) => a+b, 0) / history.length) || 0;
  avgElem.innerText = `${avg.toFixed(1)}%`;

  // predict time to full (simple linear approximation)
  if (history.length > 4) {
    const growth = history[history.length - 1] - history[0];
    const rate = growth / history.length; // per detection interval
    if (rate > 0.01) {
      const remaining = 100 - fill;
      const predictedDetections = remaining / rate;
      // our detection interval is 5s -> convert to minutes
      const predictedSeconds = predictedDetections * 5;
      const minutes = Math.floor(predictedSeconds / 60);
      const seconds = Math.floor(predictedSeconds % 60);
      timeElem.innerText = `${minutes}m ${seconds}s`;
    } else {
      timeElem.innerText = "Stable";
    }
  }

  // top item
  const top = Object.keys(items).length ? Object.keys(items).reduce((a,b) => items[a] > items[b] ? a : b) : "None";
  topElem.innerText = top;

  // update trend chart
  trendChart.data.labels.push(new Date().toLocaleTimeString());
  trendChart.data.datasets[0].data.push(fill);
  if (trendChart.data.labels.length > 15) {
    trendChart.data.labels.shift();
    trendChart.data.datasets[0].data.shift();
  }
  trendChart.update();

  // update pie
  pieChart.data.labels = Object.keys(items);
  pieChart.data.datasets[0].data = Object.values(items);
  pieChart.update();

  // check threshold
  if ((bin === "bio" && fill >= bioThreshold) ||
      (bin === "nonBio" && fill >= nonBioThreshold) ||
      (bin === "haz" && fill >= hazThreshold)) {
    alertElem.classList.remove("hidden");
  }

  displayTablePage(bin, page);
}

// Add a history row visually (appends)
function addHistoryRow(tableId, item, fill) {
  const row = document.createElement("tr");
  row.innerHTML = `<td>${new Date().toLocaleTimeString()}</td><td>${item}</td><td>${fill}%</td>`;
  document.querySelector(`#${tableId} tbody`).appendChild(row);
  // keep max rows for visual table
  const t = document.querySelector(`#${tableId} tbody`);
  while (t.children.length > 50) t.removeChild(t.firstChild);
}

// Pagination controls
function changePage(bin, dir) {
  if (bin === "bio") { bioPage += (dir==='next'?1:-1); if (bioPage<1) bioPage=1; displayTablePage('bio', bioPage); }
  else if (bin === "nonBio") { nonBioPage += (dir==='next'?1:-1); if (nonBioPage<1) nonBioPage=1; displayTablePage('nonBio', nonBioPage); }
  else { hazPage += (dir==='next'?1:-1); if (hazPage<1) hazPage=1; displayTablePage('haz', hazPage); }
}

function displayTablePage(bin, page) {
  let tableId, history, pageElem;
  if (bin === "bio") { tableId="bioHistory"; history = bioHistory; pageElem = document.getElementById("bioPageNum"); }
  else if (bin === "nonBio") { tableId="nonBioHistory"; history = nonBioHistory; pageElem = document.getElementById("nonBioPageNum"); }
  else { tableId="hazHistory"; history = hazHistory; pageElem = document.getElementById("hazPageNum"); }

  const tbody = document.querySelector(`#${tableId} tbody`);
  tbody.innerHTML = "";
  const start = (page-1)*rowsPerPage;
  const end = start + rowsPerPage;
  // history holds fill percentages; for simplicity, show generic Item label (we already appended live rows)
  history.slice(start, end).forEach((fill) => {
    const r = document.createElement("tr");
    r.innerHTML = `<td>${new Date().toLocaleTimeString()}</td><td>Item</td><td>${fill}%</td>`;
    tbody.appendChild(r);
  });
  pageElem.innerText = `Page ${page}`;
}

// Charts setup
const bioTrendChart = new Chart(document.getElementById("bioTrendChart"), {
  type: "line",
  data: { labels: [], datasets: [{ label: "Biodegradable Fill", data: [], borderColor: "#27ae60", tension: 0.35, pointRadius: 2, fill: false }] },
  options: { responsive: true, maintainAspectRatio: false, plugins:{legend:{display:false}} }
});
const nonBioTrendChart = new Chart(document.getElementById("nonBioTrendChart"), {
  type: "line",
  data: { labels: [], datasets: [{ label: "Non-Biodegradable Fill", data: [], borderColor: "#2980b9", tension: 0.35, pointRadius: 2, fill: false }] },
  options: { responsive: true, maintainAspectRatio: false, plugins:{legend:{display:false}} }
});
const hazTrendChart = new Chart(document.getElementById("hazTrendChart"), {
  type: "line",
  data: { labels: [], datasets: [{ label: "Hazardous Fill", data: [], borderColor: "#e67e22", tension: 0.35, pointRadius: 2, fill: false }] },
  options: { responsive: true, maintainAspectRatio: false, plugins:{legend:{display:false}} }
});

const bioPieChart = new Chart(document.getElementById("bioPieChart"), {
  type: "pie",
  data: { labels: [], datasets: [{ data: [], backgroundColor: ["#2ecc71","#27ae60","#1abc9c","#16a085"] }] },
  options: { responsive: true, maintainAspectRatio: false, plugins:{legend:{position:'bottom'}} }
});
const nonBioPieChart = new Chart(document.getElementById("nonBioPieChart"), {
  type: "pie",
  data: { labels: [], datasets: [{ data: [], backgroundColor: ["#3498db","#2980b9","#9b59b6","#5dade2"] }] },
  options: { responsive: true, maintainAspectRatio: false, plugins:{legend:{position:'bottom'}} }
});
const hazPieChart = new Chart(document.getElementById("hazPieChart"), {
  type: "pie",
  data: { labels: [], datasets: [{ data: [], backgroundColor: ["#f39c12","#e67e22","#d35400","#c0392b"] }] },
  options: { responsive: true, maintainAspectRatio: false, plugins:{legend:{position:'bottom'}} }
});

// Notify collector -> reset just that bin
function notifyCollector(bin) {
  alert(`Collector has been notified for ${bin} bin!`);
  let fillElem, alertElem, avgElem, timeElem, topElem, trendChart, pieChart, pageElem;
  if (bin === "bio") {
    bioFill = 0; bioHistory = []; bioItems = {}; bioPage = 1;
    fillElem = document.getElementById("bioFillLevel");
    alertElem = document.getElementById("bioAlert");
    avgElem = document.getElementById("bioAvgFill");
    timeElem = document.getElementById("bioTimeToFull");
    topElem = document.getElementById("bioTopItem");
    trendChart = bioTrendChart; pieChart = bioPieChart; pageElem = document.getElementById("bioPageNum");
    document.querySelector("#bioHistory tbody").innerHTML = "";
  } else if (bin === "nonBio") {
    nonBioFill = 0; nonBioHistory = []; nonBioItems = {}; nonBioPage = 1;
    fillElem = document.getElementById("nonBioFillLevel");
    alertElem = document.getElementById("nonBioAlert");
    avgElem = document.getElementById("nonBioAvgFill");
    timeElem = document.getElementById("nonBioTimeToFull");
    topElem = document.getElementById("nonBioTopItem");
    trendChart = nonBioTrendChart; pieChart = nonBioPieChart; pageElem = document.getElementById("nonBioPageNum");
    document.querySelector("#nonBioHistory tbody").innerHTML = "";
  } else {
    hazFill = 0; hazHistory = []; hazItems = {}; hazPage = 1;
    fillElem = document.getElementById("hazFillLevel");
    alertElem = document.getElementById("hazAlert");
    avgElem = document.getElementById("hazAvgFill");
    timeElem = document.getElementById("hazTimeToFull");
    topElem = document.getElementById("hazTopItem");
    trendChart = hazTrendChart; pieChart = hazPieChart; pageElem = document.getElementById("hazPageNum");
    document.querySelector("#hazHistory tbody").innerHTML = "";
  }

  // Reset UI
  fillElem.style.width = "0%"; fillElem.innerText = "0%";
  alertElem.classList.add("hidden");
  trendChart.data.labels = []; trendChart.data.datasets[0].data = []; trendChart.update();
  pieChart.data.labels = []; pieChart.data.datasets[0].data = []; pieChart.update();
  avgElem.innerText = "0%"; timeElem.innerText = "0m 0s"; topElem.innerText = "None";
  pageElem.innerText = "Page 1";
}

// Recycling tips
const tips = [
  "Plastic bottles can be reused as planters.",
  "Old newspapers can be used for packing fragile items.",
  "Glass jars can be used for storage.",
  "Compost food scraps to reduce biodegradable waste.",
  "Recycle batteries at proper drop-off points.",
  "Flatten cardboard to save space when recycling."
];
function showTip() {
  const tip = tips[Math.floor(Math.random() * tips.length)];
  document.getElementById("tipText").innerText = tip;
}

/* === Simulation === */
setInterval(updateDetection, 5000);

// initialize some small UI values / ping
document.getElementById("lastPing").textContent = new Date().toLocaleTimeString();
document.getElementById("solarHealth").textContent = "Good";

// Seed small initial dataset to show charts not empty
(function seed() {
  const seedItems = ["Organic","Paper","Plastic","Metal","Glass","Battery"];
  seedItems.forEach((it, idx) => {
    setTimeout(()=> {
      const cat = itemCategories[it];
      document.getElementById("detectionPreview").innerText = "Detected: " + it;
      showEmoji(cat.emoji);
      updateBin(cat.bin, it);
    }, idx * 300);
  });
})();


// Auto-detect simulation every 5 seconds
setInterval(updateDetection, 5000);


