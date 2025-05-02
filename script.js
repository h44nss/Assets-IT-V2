let devices = [];
let editingIndex = -1;
const WEB_APP_URL =
  "https://script.google.com/macros/s/AKfycbxlkIBjXexp-sbd3BNyFb1dqOR6bbz-pOG6iNBdyYmz_YWuokVOZeJ5kddR350igeo4qg/exec"; // Use your deployment URL

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
const loadingIndicator = document.getElementById("loading-indicator");
const errorMessage = document.getElementById("error-message");

// Event Listeners
addDeviceBtn.addEventListener("click", showForm);
cancelFormBtn.addEventListener("click", hideForm);
deviceForm.addEventListener("submit", handleFormSubmit);
filterCategory.addEventListener("change", applyFilters);
filterStatus.addEventListener("change", applyFilters);
searchInput.addEventListener("input", applyFilters);

// Initialize
document.addEventListener("DOMContentLoaded", () => {
  fetchDevicesFromSpreadsheet(); // Load from Google Sheet
});

function showForm() {
  addForm.style.display = "block";
  deviceForm.reset();
  document.getElementById("device-date").valueAsDate = new Date();
  editingIndex = -1;
}

function hideForm() {
  addForm.style.display = "none";
}

function showLoading(show = true) {
  if (loadingIndicator) {
    loadingIndicator.style.display = show ? "block" : "none";
  }
}

function showError(message, duration = 5000) {
  if (errorMessage) {
    errorMessage.textContent = message;
    errorMessage.style.display = "block";
    
    setTimeout(() => {
      errorMessage.style.display = "none";
    }, duration);
  } else {
    alert(message);
  }
}

function handleFormSubmit(e) {
  e.preventDefault();
  showLoading(true);

  const deviceData = {
    name: document.getElementById("device-name").value,
    category: document.getElementById("device-category").value,
    serial: document.getElementById("device-serial").value,
    date: document.getElementById("device-date").value,
    destination: document.getElementById("device-destination").value,
    status: document.getElementById("device-status").value,
  };

  // Save to Spreadsheet with CORS mode specifications
  fetch(WEB_APP_URL, {
    method: "POST",
    body: JSON.stringify(deviceData),
    headers: {
      "Content-Type": "application/json",
    },
    mode: "cors" // Explicitly set CORS mode
  })
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      return response.json();
    })
    .then((data) => {
      showLoading(false);
      if (data.result === "success") {
        fetchDevicesFromSpreadsheet(); // Refresh data
        hideForm();
      } else {
        showError("Gagal menyimpan: " + (data.message || "Terjadi kesalahan"));
      }
    })
    .catch((err) => {
      showLoading(false);
      showError("Error: " + err.message);
      console.error("Form submission error:", err);
    });
}

// Updated fetchDevicesFromSpreadsheet function to use the service worker proxy
async function fetchDevicesFromSpreadsheet() {
  try {
    // Your Google Apps Script URL
    const gasUrl = 'https://script.google.com/macros/s/AKfycbxlkIBjXexp-sbd3BNyFb1dqOR6bbz-pOG6iNBdyYmz_YWuokVOZeJ5kddR350igeo4qg/exec';
    
    // Make the request through our proxy endpoint
    const response = await fetch(`/proxy-to-gas?url=${encodeURIComponent(gasUrl)}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Data berhasil diambil:', data);
    return data;
  } catch (error) {
    console.error('Gagal ambil data dari spreadsheet:', error);
    throw error;
  }
}

// Example for POST requests if you need them
async function saveDataToSpreadsheet(data) {
  try {
    // Your Google Apps Script URL
    const gasUrl = 'https://script.google.com/macros/s/AKfycbxlkIBjXexp-sbd3BNyFb1dqOR6bbz-pOG6iNBdyYmz_YWuokVOZeJ5kddR350igeo4qg/exec';
    
    // Make the request through our proxy endpoint
    const response = await fetch(`/proxy-to-gas?url=${encodeURIComponent(gasUrl)}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    const result = await response.json();
    console.log('Data berhasil disimpan:', result);
    return result;
  } catch (error) {
    console.error('Gagal simpan data ke spreadsheet:', error);
    throw error;
  }
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

  if (filteredDevices.length === 0) {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td colspan="7" class="text-center">Tidak ada data yang sesuai dengan filter</td>`;
    devicesList.appendChild(tr);
    return;
  }

  filteredDevices.forEach((device) => {
    const tr = document.createElement("tr");

    // Handle date formatting safely
    let formattedDate = "Invalid Date";
    try {
      if (device.tanggalpengambilan) {
        const dateObj = new Date(device.tanggalpengambilan);
        if (!isNaN(dateObj.getTime())) {
          formattedDate = dateObj.toLocaleDateString("id-ID", {
            day: "numeric",
            month: "long",
            year: "numeric",
          });
        }
      }
    } catch (e) {
      console.warn("Date formatting error:", e);
    }

    tr.innerHTML = `
      <td>${device.namadevice || ""}</td>
      <td>${device.kategori || ""}</td>
      <td>${device.nomorseri || ""}</td>
      <td>${formattedDate}</td>
      <td>${device.lokasitujuan || ""}</td>
      <td>${device.status || ""}</td>
      <td><small>${device.timestamp || ""}</small></td>
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
