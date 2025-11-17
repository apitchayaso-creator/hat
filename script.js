/* ==============================================
 * 1. Google Sheet Configuration
 * ============================================== */

const GOOGLE_SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vT0VMTq_QybVuvg5g-TLeRBWRoB6UH02mrbZUlAXaymuT5471AQBBa0MsreyaM94eJECfcvdAzNJXwj/pub?gid=0&single=true&output=csv';

let allEventsData = [];

/* ==============================================
 * 2. CSV Parsing Function
 * ============================================== */

function parseCSV(csvText) {
  const lines = csvText.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.trim());
  const data = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',');
    if (values.length === headers.length) {
      const entry = {};
      for (let j = 0; j < headers.length; j++) {
        entry[headers[j]] = values[j].trim();
      }
      data.push(entry);
    }
  }
  return data;
}

/* ==============================================
 * 3. Initialize Dashboard
 * ============================================== */

function initializeDashboard(data) {
  allEventsData = data;

  function updateDashboard() {
    const helmetCount = allEventsData.filter(
      (row) => row.Helmet_Status === 'Helmet Worn'
    ).length;
    const noHelmetCount = allEventsData.filter(
      (row) => row.Helmet_Status === 'No Helmet'
    ).length;
    const plateCount = allEventsData.filter(
      (row) => row.License_Plate_Text !== 'N/A' && row.License_Plate_Text !== ''
    ).length;
    
    const totalToday = helmetCount + noHelmetCount;
    const rate = totalToday > 0 ? Math.round((helmetCount / totalToday) * 100) : 0;

    document.querySelector('.stat-box:nth-child(1) strong').textContent = helmetCount;
    document.querySelector('.stat-box:nth-child(2) strong').textContent = noHelmetCount;
    document.querySelector('.stat-box:nth-child(3) strong').textContent = plateCount;
    document.querySelector('.stat-box.circle .value').textContent = `${rate}%`;
  }

  /* ==============================================
   * 4. Daily & Monthly Charts
   * ============================================== */

  new Chart(document.getElementById('dailyChart'), {
    type: 'bar',
    data: {
      labels: ['M', 'T', 'W', 'Th', 'F', 'Sa', 'Su'],
      datasets: [
        {
          label: 'With helmet',
          data: [30, 32, 28, 35, 33, 29, 31],
          backgroundColor: '#1a73e8',
        },
        {
          label: 'Helmetless',
          data: [5, 6, 4, 7, 6, 5, 4],
          backgroundColor: '#e53935',
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: 'bottom' },
      },
    },
  });

  new Chart(document.getElementById('monthlyChart'), {
    type: 'line',
    data: {
      labels: ['1', '2', '3', '4', '5', '6'],
      datasets: [
        {
          label: 'Helmet wearing rate (%)',
          data: [72, 75, 77, 78, 79, 80],
          borderColor: '#1a73e8',
          backgroundColor: 'rgba(26,115,232,0.1)',
          fill: true,
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: 'bottom' },
      },
    },
  });

  /* ==============================================
   * 5. Camera Locations Map
   * ============================================== */

  const cameraLocations = [
    { name: 'Gate 1', lat: 16.8350625, lng: 100.2153125 },
    { name: 'Gate 2', lat: 16.8239375, lng: 100.2155625 },
    { name: 'Gate 3', lat: 16.8302341, lng: 100.2030665 },
  ];

  const map = L.map('map').setView([16.829, 100.212], 15);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors',
  }).addTo(map);

  cameraLocations.forEach((cam) => {
    const total = allEventsData.filter(row => row.Gate_ID === cam.name).length;
    const noHelmet = allEventsData.filter(row => row.Gate_ID === cam.name && row.Helmet_Status === 'No Helmet').length;
    
    L.marker([cam.lat, cam.lng])
      .bindPopup(
        `<strong>${cam.name}</strong><br>Without helmet: ${noHelmet} times<br>Total: ${total} times`
      )
      .addTo(map);
  });

  updateDashboard();
}

/* ==============================================
 * 6. Popup Functions
 * ============================================== */

function showPopup(type) {
  const popup = document.getElementById('popup');
  const body = document.getElementById('popup-body');

  let content = '';

  if (type === 'helmet') {
    const helmetList = allEventsData
      .filter(
        (row) =>
          row.Helmet_Status === 'Helmet Worn' && row.License_Plate_Text !== 'N/A' && row.License_Plate_Text !== ''
      )
      .map(
        (row) => `<li>${row.License_Plate_Text} - (${row.Gate_ID})</li>`
      )
      .join('');
    content = `<h3>Users Wearing Helmets</h3><ul>${helmetList}</ul>`;
  } else if (type === 'noHelmet') {
    const noHelmetList = allEventsData
      .filter(
        (row) =>
          row.Helmet_Status === 'No Helmet' && row.License_Plate_Text !== 'N/A' && row.License_Plate_Text !== ''
      )
      .map(
        (row) => `<li>${row.License_Plate_Text} - (${row.Gate_ID})</li>`
      )
      .join('');
    content = `<h3>Users Without Helmets</h3><ul>${noHelmetList}</ul>`;
  } else if (type === 'plates') {
    const plateList = allEventsData
      .filter((row) => row.License_Plate_Text !== 'N/A' && row.License_Plate_Text !== '')
      .map((row) => `<li>${row.License_Plate_Text}</li>`)
      .join('');
    content = `<h3>Detected License Plates</h3><ul>${plateList}</ul>`;
  } else if (type === 'rate') {
    const helmetCount = allEventsData.filter(
      (row) => row.Helmet_Status === 'Helmet Worn'
    ).length;
    const totalToday = allEventsData.filter(
      (row) => row.Helmet_Status === 'Helmet Worn' || row.Helmet_Status === 'No Helmet'
    ).length;
    const rate = totalToday > 0 ? Math.round((helmetCount / totalToday) * 100) : 0;
    content = `<h3>Helmet Wearing Rate Today</h3><p>Total: ${totalToday} people<br>With helmet: ${helmetCount} people<br>Rate: ${rate}%</p>`;
  }

  body.innerHTML = content;
  popup.classList.remove('hidden');
}

function closePopup() {
  document.getElementById('popup').classList.add('hidden');
}

/* ==============================================
 * 7. Load Data on Page Load
 * ============================================== */

window.addEventListener('load', () => {
  // For now, initialize with empty data
  // In production, fetch from Google Sheet:
  // fetch(GOOGLE_SHEET_CSV_URL)
  //   .then(res => res.text())
  //   .then(csv => initializeDashboard(parseCSV(csv)))
  //   .catch(err => console.error(err));
  
  initializeDashboard([]);
});
  