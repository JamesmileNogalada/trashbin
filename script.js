let threshold = 80;
let totalItems = 0;
let currentFill = 0;
let currentWeight = 0;
let avgFill = 0;
let fillHistory = [];

const categoryCounts = {
  Plastic: 0,
  Organic: 0,
  Paper: 0,
  Metal: 0,
  Glass: 0
};

const itemContributions = {
  Plastic: 5,
  Organic: 7,
  Paper: 3,
  Metal: 6,
  Glass: 8
};

const sampleItems = ["Plastic", "Organic", "Paper", "Metal", "Glass"];

document.getElementById("thresholdInput").addEventListener("input", (e) => {
  threshold = parseInt(e.target.value);
});

document.getElementById("notifyBtn").addEventListener("click", () => {
  alert("✅ Collector has been notified! Bin emptied.");
  document.getElementById("alertBox").classList.add("hidden");
  resetBin();
});

function resetBin() {
  currentFill = 0;
  currentWeight = 0;
  fillHistory = [];
  document.getElementById("fillLevel").style.width = "0%";
  document.getElementById("fillLevel").innerText = "0%";
  document.getElementById("weight").innerText = "0 kg";
  document.getElementById("timeToFull").innerText = "Reset";
}

function updateInsights() {
  fillHistory.push(currentFill);
  if (fillHistory.length > 20) fillHistory.shift();

  avgFill = (
    fillHistory.reduce((a, b) => a + b, 0) / fillHistory.length
  ).toFixed(1);
  document.getElementById("avgFill").innerText = `${avgFill}%`;

  if (currentFill >= threshold) {
    document.getElementById("alertBox").classList.remove("hidden");
  }

  trendChart.data.labels.push(new Date().toLocaleTimeString());
  trendChart.data.datasets[0].data.push(currentFill);

  if (trendChart.data.labels.length > 15) {
    trendChart.data.labels.shift();
    trendChart.data.datasets[0].data.shift();
  }

  trendChart.update();

  if (fillHistory.length > 5) {
    let growth = fillHistory[fillHistory.length - 1] - fillHistory[0];
    let rate = growth / fillHistory.length;

    if (rate > 0) {
      let remaining = 100 - currentFill;
      let predictedSeconds = (remaining / rate) * 5;
      let minutes = Math.floor(predictedSeconds / 60);
      let seconds = Math.floor(predictedSeconds % 60);
      document.getElementById("timeToFull").innerText = `${minutes}m ${seconds}s`;
    } else {
      document.getElementById("timeToFull").innerText = "Stable";
    }
  }
}

function updateDetection() {
  const item = sampleItems[Math.floor(Math.random() * sampleItems.length)];
  document.getElementById("detectionPreview").innerText = "Detected: " + item;

  currentFill += itemContributions[item];
  if (currentFill > 100) currentFill = 100;

  currentWeight = (currentFill * 0.05).toFixed(1);

  document.getElementById("fillLevel").style.width = `${currentFill}%`;
  document.getElementById("fillLevel").innerText = `${currentFill}%`;
  document.getElementById("weight").innerText = `${currentWeight} kg`;
  document.getElementById("lastOpened").innerText = new Date().toLocaleTimeString();

  totalItems++;
  categoryCounts[item]++;
  document.getElementById("totalItems").innerText = totalItems;

  const row = document.createElement("tr");
  row.innerHTML = `
    <td>${new Date().toLocaleTimeString()}</td>
    <td>${item}</td>
    <td>${currentFill}%</td>
    <td>${currentWeight} kg</td>
  `;
  document.querySelector("#historyTable tbody").prepend(row);

  wasteChart.data.datasets[0].data = Object.values(categoryCounts);
  wasteChart.update();

  const topCategory = Object.keys(categoryCounts).reduce((a, b) =>
    categoryCounts[a] > categoryCounts[b] ? a : b
  );
  document.getElementById("topItem").innerText = topCategory;

  updateInsights();

  if (currentFill >= 100) {
    document.getElementById("alertBox").classList.remove("hidden");
  }
}

setInterval(updateDetection, 5000);

// Charts
const wasteChart = new Chart(document.getElementById("wasteChart").getContext("2d"), {
  type: "pie",
  data: {
    labels: ["Plastic", "Organic", "Paper", "Metal", "Glass"],
    datasets: [{
      data: [0, 0, 0, 0, 0],
      backgroundColor: ["#3498db", "#27ae60", "#f1c40f", "#e67e22", "#9b59b6"]
    }]
  },
  options: {
    responsive: true,
    plugins: {
      legend: {
        position: "bottom"
      }
    }
  }
});

const trendChart = new Chart(document.getElementById("trendChart").getContext("2d"), {
  type: "line",
  data: {
    labels: [],
    datasets: [{
      label: "Fill Level %",
      data: [],
      borderColor: "#2980b9",
      fill: false,
      tension: 0.3
    }]
  },
  options: {
    responsive: true,
    scales: {
      y: {
        beginAtZero: true,
        max: 100
      }
    }
  }
});

if ("Notification" in window && Notification.permission !== "granted") {
  Notification.requestPermission();
}

function sendNotification(message) {
  if ("Notification" in window && Notification.permission === "granted") {
    new Notification("🚮 Smart Trash Bin Alert", {
      body: message,
      icon: "https://cdn-icons-png.flaticon.com/512/679/679922.png"
    });
  }
}

// Modify the detection logic to trigger notification
function checkFullNotification() {
  if (currentFill >= 100) {
    sendNotification("The trash bin is full! Please empty it.");
  } else if (currentFill >= threshold) {
    sendNotification(`Bin reached ${threshold}% capacity. Schedule collection soon.`);
  }
}
checkFullNotification();

  if (currentFill >= 100) {
    document.getElementById("alertBox").classList.remove("hidden");
  }
{
  // 🔔 New: trigger browser notification
  checkFullNotification();}

// Call this inside your updateDetection after alert logic
function updateDetection() {
  const item = sampleItems[Math.floor(Math.random() * sampleItems.length)];
  document.getElementById("detectionPreview").innerText = "Detected: " + item;

  currentFill += itemContributions[item];
  if (currentFill > 100) currentFill = 100;

  currentWeight = (currentFill * 0.05).toFixed(1);

  document.getElementById("fillLevel").style.width = `${currentFill}%`;
  document.getElementById("fillLevel").innerText = `${currentFill}%`;
  document.getElementById("weight").innerText = `${currentWeight} kg`;
  document.getElementById("lastOpened").innerText = new Date().toLocaleTimeString();

  totalItems++;
  categoryCounts[item]++;
  document.getElementById("totalItems").innerText = totalItems;

  const row = document.createElement("tr");
  row.innerHTML = `
    <td>${new Date().toLocaleTimeString()}</td>
    <td>${item}</td>
    <td>${currentFill}%</td>
    <td>${currentWeight} kg</td>
  `;
  document.querySelector("#historyTable tbody").prepend(row);

  wasteChart.data.datasets[0].data = Object.values(categoryCounts);
  wasteChart.update();

  const topCategory = Object.keys(categoryCounts).reduce((a, b) =>
    categoryCounts[a] > categoryCounts[b] ? a : b
  );
  document.getElementById("topItem").innerText = topCategory;

  updateInsights();

  if (currentFill >= 100) {
    document.getElementById("alertBox").classList.remove("hidden");
  }

  // 🔔 New: trigger browser notification
  checkFullNotification();
}