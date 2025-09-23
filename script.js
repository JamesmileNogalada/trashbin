let bioThreshold = 80, nonBioThreshold = 80, hazThreshold = 80;
let bioFill = 0, nonBioFill = 0, hazFill = 0;
let bioHistory = [], nonBioHistory = [], hazHistory = [];
let bioItems = {}, nonBioItems = {}, hazItems = {};
let bioPage = 1, nonBioPage = 1, hazPage = 1;
const rowsPerPage = 5;

const itemCategories = {
  Organic: { bin: "bio", emoji: "🍌" },
  Paper: { bin: "bio", emoji: "📦" },
  Plastic: { bin: "nonBio", emoji: "🥤" },
  Metal: { bin: "nonBio", emoji: "🥫" },
  Glass: { bin: "nonBio", emoji: "🍾" },
  Battery: { bin: "haz", emoji: "🔋" },
  Chemicals: { bin: "haz", emoji: "☠️" }
};

const itemContributions = {
  Plastic: 5, Organic: 7, Paper: 3,
  Metal: 6, Glass: 8, Battery: 10, Chemicals: 12
};
const sampleItems = Object.keys(itemCategories);

// Handle threshold changes
document.getElementById("bioThreshold").addEventListener("input", e => bioThreshold = parseInt(e.target.value));
document.getElementById("nonBioThreshold").addEventListener("input", e => nonBioThreshold = parseInt(e.target.value));
document.getElementById("hazThreshold").addEventListener("input", e => hazThreshold = parseInt(e.target.value));

// Emoji display
function showEmoji(emoji) {
  const log = document.getElementById("emojiLog");
  log.innerHTML = `<span>${emoji}</span>`;
}

// Random detection simulation
function updateDetection() {
  const item = sampleItems[Math.floor(Math.random() * sampleItems.length)];
  const category = itemCategories[item];
  document.getElementById("detectionPreview").innerText = "Detected: " + item;
  showEmoji(category.emoji);
  updateBin(category.bin, item);
}

// Update bin stats
function updateBin(bin, item) {
  let fill, history, items, fillElem, alertElem,
      avgElem, timeElem, topElem, trendChart, pieChart,
      page, pageElem;

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

  fillElem.style.width = `${fill}%`; 
  fillElem.innerText = `${fill}%`;

  history.push(fill); if (history.length > 20) history.shift();
  items[item] = (items[item] || 0) + 1;

  const avg = (history.reduce((a, b) => a + b, 0) / history.length).toFixed(1);
  avgElem.innerText = `${avg}%`;

  if (history.length > 5) {
    let growth = history[history.length - 1] - history[0];
    let rate = growth / history.length;
    if (rate > 0) {
      let remaining = 100 - fill;
      let predictedSeconds = (remaining / rate) * 5;
      let minutes = Math.floor(predictedSeconds / 60);
      let seconds = Math.floor(predictedSeconds % 60);
      timeElem.innerText = `${minutes}m ${seconds}s`;
    } else timeElem.innerText = "Stable";
  }

  let top = Object.keys(items).reduce((a, b) => items[a] > items[b] ? a : b, "None");
  topElem.innerText = top;

  trendChart.data.labels.push(new Date().toLocaleTimeString());
  trendChart.data.datasets[0].data.push(fill);
  if (trendChart.data.labels.length > 15) {
    trendChart.data.labels.shift();
    trendChart.data.datasets[0].data.shift();
  }
  trendChart.update();

  pieChart.data.labels = Object.keys(items);
  pieChart.data.datasets[0].data = Object.values(items);
  pieChart.update();

  if ((bin === "bio" && fill >= bioThreshold) ||
      (bin === "nonBio" && fill >= nonBioThreshold) ||
      (bin === "haz" && fill >= hazThreshold)) {
    alertElem.classList.remove("hidden");
  }

  displayTablePage(bin, page);
}

// Add history row
function addHistoryRow(tableId, item, fill) {
  const row = document.createElement("tr");
  row.innerHTML = `<td>${new Date().toLocaleTimeString()}</td><td>${item}</td><td>${fill}%</td>`;
  document.querySelector(`#${tableId} tbody`).appendChild(row);
}

// Pagination
function changePage(bin, dir) {
  if (bin === "bio") {
    bioPage += (dir === "next" ? 1 : -1);
    if (bioPage < 1) bioPage = 1;
    displayTablePage("bio", bioPage);
  } else if (bin === "nonBio") {
    nonBioPage += (dir === "next" ? 1 : -1);
    if (nonBioPage < 1) nonBioPage = 1;
    displayTablePage("nonBio", nonBioPage);
  } else {
    hazPage += (dir === "next" ? 1 : -1);
    if (hazPage < 1) hazPage = 1;
    displayTablePage("haz", hazPage);
  }
}

function displayTablePage(bin, page) {
  let tableId, history, pageElem;
  if (bin === "bio") { tableId = "bioHistory"; history = bioHistory; pageElem = document.getElementById("bioPageNum"); }
  else if (bin === "nonBio") { tableId = "nonBioHistory"; history = nonBioHistory; pageElem = document.getElementById("nonBioPageNum"); }
  else { tableId = "hazHistory"; history = hazHistory; pageElem = document.getElementById("hazPageNum"); }

  const table = document.querySelector(`#${tableId} tbody`);
  table.innerHTML = "";
  const start = (page - 1) * rowsPerPage;
  const end = start + rowsPerPage;

  history.slice(start, end).forEach((fill, i) => {
    const row = document.createElement("tr");
    row.innerHTML = `<td>${new Date().toLocaleTimeString()}</td><td>Item</td><td>${fill}%</td>`;
    table.appendChild(row);
  });
  pageElem.innerText = `Page ${page}`;
}

// Charts
const bioTrendChart = new Chart(document.getElementById("bioTrendChart"), {
  type: "line",
  data: { labels: [], datasets: [{ label: "Biodegradable Fill", data: [], borderColor: "#27ae60", fill: false }] }
});
const nonBioTrendChart = new Chart(document.getElementById("nonBioTrendChart"), {
  type: "line",
  data: { labels: [], datasets: [{ label: "Non-Biodegradable Fill", data: [], borderColor: "#2980b9", fill: false }] }
});
const hazTrendChart = new Chart(document.getElementById("hazTrendChart"), {
  type: "line",
  data: { labels: [], datasets: [{ label: "Hazardous Fill", data: [], borderColor: "#e67e22", fill: false }] }
});

const bioPieChart = new Chart(document.getElementById("bioPieChart"), {
  type: "pie",
  data: { labels: [], datasets: [{ data: [], backgroundColor: ["#2ecc71", "#27ae60", "#1abc9c"] }] }
});
const nonBioPieChart = new Chart(document.getElementById("nonBioPieChart"), {
  type: "pie",
  data: { labels: [], datasets: [{ data: [], backgroundColor: ["#3498db", "#2980b9", "#9b59b6"] }] }
});
const hazPieChart = new Chart(document.getElementById("hazPieChart"), {
  type: "pie",
  data: { labels: [], datasets: [{ data: [], backgroundColor: ["#e67e22", "#d35400", "#c0392b"] }] }
});

// Notify collector (per-bin reset)
function notifyCollector(bin) {
  alert(`Collector has been notified for ${bin} bin!`);

  let fillElem, alertElem, avgElem, timeElem, topElem,
      trendChart, pieChart, pageElem;

  if (bin === "bio") {
    bioFill = 0; bioHistory = []; bioItems = {}; bioPage = 1;
    fillElem = document.getElementById("bioFillLevel");
    alertElem = document.getElementById("bioAlert");
    avgElem = document.getElementById("bioAvgFill");
    timeElem = document.getElementById("bioTimeToFull");
    topElem = document.getElementById("bioTopItem");
    trendChart = bioTrendChart; pieChart = bioPieChart;
    pageElem = document.getElementById("bioPageNum");
    document.querySelector("#bioHistory tbody").innerHTML = "";
  } else if (bin === "nonBio") {
    nonBioFill = 0; nonBioHistory = []; nonBioItems = {}; nonBioPage = 1;
    fillElem = document.getElementById("nonBioFillLevel");
    alertElem = document.getElementById("nonBioAlert");
    avgElem = document.getElementById("nonBioAvgFill");
    timeElem = document.getElementById("nonBioTimeToFull");
    topElem = document.getElementById("nonBioTopItem");
    trendChart = nonBioTrendChart; pieChart = nonBioPieChart;
    pageElem = document.getElementById("nonBioPageNum");
    document.querySelector("#nonBioHistory tbody").innerHTML = "";
  } else {
    hazFill = 0; hazHistory = []; hazItems = {}; hazPage = 1;
    fillElem = document.getElementById("hazFillLevel");
    alertElem = document.getElementById("hazAlert");
    avgElem = document.getElementById("hazAvgFill");
    timeElem = document.getElementById("hazTimeToFull");
    topElem = document.getElementById("hazTopItem");
    trendChart = hazTrendChart; pieChart = hazPieChart;
    pageElem = document.getElementById("hazPageNum");
    document.querySelector("#hazHistory tbody").innerHTML = "";
  }

  // Reset progress bar
  fillElem.style.width = "0%";
  fillElem.innerText = "0%";

  // Hide alert
  alertElem.classList.add("hidden");

  // Reset charts
  trendChart.data.labels = [];
  trendChart.data.datasets[0].data = [];
  trendChart.update();

  pieChart.data.labels = [];
  pieChart.data.datasets[0].data = [];
  pieChart.update();

  // Reset insights
  avgElem.innerText = "0%";
  timeElem.innerText = "0m 0s";
  topElem.innerText = "None";

  // Reset pagination
  pageElem.innerText = "Page 1";
}

// Recycling tips
const tips = [
  "Plastic bottles can be reused as planters.",
  "Old newspapers can be used for packing fragile items.",
  "Glass jars can be used for storage.",
  "Compost food scraps to reduce biodegradable waste.",
  "Recycle batteries at proper drop-off points."
];
function showTip() {
  const tip = tips[Math.floor(Math.random() * tips.length)];
  document.getElementById("tipText").innerText = tip;
}

// Auto-detect simulation every 5 seconds
setInterval(updateDetection, 5000);

