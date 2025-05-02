let devices = [];
let editingIndex = -1;
const WEB_APP_URL =
  "https://script.google.com/macros/s/AKfycbxlkIBjXexp-sbd3BNyFb1dqOR6bbz-pOG6iNBdyYmz_YWuokVOZeJ5kddR350igeo4qg/exec"; // Ganti ini!

// DOM Elements
const addDeviceBtn = document.getElementById("add-device-btn");
const addForm = document.getElementById("add-form");
const deviceForm = document.getElementById("device-form");
const cancelFormBtn = document.getElementById("cancel-form");
const devicesList = document.getElementById("devices-list");
const totalDevicesEl = document.getElementById("total-devices");
const incomingDevicesEl = document.getElementById("incoming-devices");
const outgoingDevicesEl = document.getElementById("outgoing-devices");
const filterCategory = document.getElementById("filter-category");
const filterStatus = document.getElementById("filter-status");
const searchInput = document.getElementById("search-input");

// Event Listeners
addDeviceBtn.addEventListener("click", showForm);
cancelFormBtn.addEventListener("click", hideForm);
deviceForm.addEventListener("submit", handleFormSubmit);
filterCategory.addEventListener("change", applyFilters);
filterStatus.addEventListener("change", applyFilters);
searchInput.addEventListener("input", applyFilters);

fetchDevicesFromSpreadsheet(); // Load dari Google Sheet

function showForm() {
  addForm.style.display = "block";
  deviceForm.reset();
  editingIndex = -1;
}

function hideForm() {
  addForm.style.display = "none";
}

function handleFormSubmit(e) {
  e.preventDefault();

  const deviceData = {
    name: document.getElementById("device-name").value,
    category: document.getElementById("device-category").value,
    serial: document.getElementById("device-serial").value,
    date: document.getElementById("device-date").value,
    destination: document.getElementById("device-destination").value,
    status: document.getElementById("device-status").value,
  };

  // Simpan ke Spreadsheet
  fetch(WEB_APP_URL, {
    method: "POST",
    body: JSON.stringify(deviceData),
    headers: {
      "Content-Type": "application/json",
    },
  })
    .then((res) => res.json())
    .then((response) => {
      if (response.result === "success") {
        fetchDevicesFromSpreadsheet(); // Refresh data
        hideForm();
      } else {
        alert("Gagal menyimpan: " + response.message);
      }
    })
    .catch((err) => {
      alert("Error: " + err.message);
    });
}

function fetchDevicesFromSpreadsheet() {
  fetch(WEB_APP_URL)
    .then((res) => res.json())
    .then((data) => {
      devices = data;
      renderDevices();
      updateSummary();
    })
    .catch((err) => {
      console.error("Gagal ambil data dari spreadsheet:", err);
    });
}

function renderDevices() {
  devicesList.innerHTML = "";
  const categoryFilter = filterCategory.value;
  const statusFilter = filterStatus.value;
  const searchQuery = searchInput.value.toLowerCase();

  const filteredDevices = devices.filter((device) => {
    const categoryMatch =
      categoryFilter === "all" || device.kategori === categoryFilter;
    const statusMatch =
      statusFilter === "all" || device.status === statusFilter;
    const searchMatch =
      device.namadevice?.toLowerCase().includes(searchQuery) ||
      device.nomorseri?.toLowerCase().includes(searchQuery) ||
      device.lokasitujuan?.toLowerCase().includes(searchQuery);
    return categoryMatch && statusMatch && searchMatch;
  });

  filteredDevices.forEach((device) => {
    const tr = document.createElement("tr");

    const formattedDate = new Date(
      device.tanggalpengambilan
    ).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    tr.innerHTML = `
      <td>${device.namadevice}</td>
      <td>${device.kategori}</td>
      <td>${device.nomorseri}</td>
      <td>${formattedDate}</td>
      <td>${device.lokasitujuan}</td>
      <td>${device.status}</td>
      <td><small>(readonly)</small></td>
    `;

    devicesList.appendChild(tr);
  });
}

function updateSummary() {
  totalDevicesEl.textContent = devices.length;
  const incoming = devices.filter((d) => d.status === "Masuk").length;
  const outgoing = devices.filter((d) => d.status === "Keluar").length;
  incomingDevicesEl.textContent = incoming;
  outgoingDevicesEl.textContent = outgoing;
}

function applyFilters() {
  renderDevices();
}
