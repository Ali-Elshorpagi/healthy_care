document.addEventListener('DOMContentLoaded', function () {
  if (!checkAuthenticationAndRedirect()) {
    return;
  }

  buildHeader();
  buildSidebar('medical-records');
  loadMedicalRecords();
  setupSearch();
  setupFilter();
});

async function loadMedicalRecords() {
  try {
    const userId = sessionStorage.getItem('userId');
    if (!userId) {
      showEmptyState();
      return;
    }

    const [recordsResponse, usersResponse] = await Promise.all([
      fetch('http://localhost:8875/records'),
      fetch('http://localhost:8877/users')
    ]);

    if (!recordsResponse.ok) {
      throw new Error('Failed to fetch medical records');
    }

    const allRecords = await recordsResponse.json();
    const allUsers = await usersResponse.json();

    // Get list of existing doctor IDs (approved doctors)
    const existingDoctorIds = allUsers
      .filter(user => user.role === 'doctor' && user.approved === 'approved')
      .map(doc => doc.id);

    // Filter records: user's records, not deleted, and doctor still exists
    const userRecords = allRecords.filter(
      (record) => record.patientId === userId &&
        !record.isDeleted &&
        existingDoctorIds.includes(record.doctorId)
    );

    loadedRecords = userRecords;
    if (userRecords.length === 0) {
      showEmptyState();
      return;
    }

    renderMedicalRecords(userRecords);
  } catch (error) {
    console.error('Error loading medical records:', error);
    showError(
      'Failed to load medical records. Please make sure JSON Server is running.'
    );
  }
}

function renderMedicalRecords(records) {
  const container = document.getElementById('recordsList');
  container.innerHTML = '';

  const doctorGroups = {};
  records.forEach((record) => {
    if (!doctorGroups[record.doctorId]) {
      doctorGroups[record.doctorId] = {
        doctorName: record.doctorName,
        doctorSpecialization: record.doctorSpecialization,
        doctorClinic: record.doctorClinic,
        doctorAvatar: record.doctorAvatar,
        records: [],
      };
    }
    doctorGroups[record.doctorId].records.push(record);
  });

  Object.keys(doctorGroups).forEach((doctorId) => {
    const group = doctorGroups[doctorId];
    const section = document.createElement('div');
    section.className = 'doctor-section card';

    section.innerHTML = `
      <div class="doctor-row">
        <div class="doctor-avatar">
          <img src="${group.doctorAvatar}" alt="${group.doctorName}" />
        </div>
        <div class="doctor-info">
          <h3>${group.doctorName}</h3>
          <p>${group.doctorSpecialization} - ${group.doctorClinic}</p>
        </div>
        <div class="doctor-actions">
          <span class="badge badge-blue">${group.records.length} Records</span>
        </div>
      </div>
      <div class="records-list">
        ${group.records.map((record) => renderRecordItem(record)).join('')}
      </div>
    `;

    container.appendChild(section);
  });
}

function renderRecordItem(record) {
  const typeLabel = getTypeLabel(record.type);
  const formattedDate = formatDate(record.date);

  return `
    <div class="list-item record-item" data-type="${record.type}">
      <div class="icon-col">
        <span class="list-icon ${record.iconColor}">
          <span class="material-symbols-outlined">${record.icon}</span>
        </span>
      </div>
      <div class="content-col">
        <p class="list-title">${record.title}</p>
        <p class="list-meta">
          <span>${typeLabel}</span>
          <span>${formattedDate}</span>
        </p>
      </div>
      <div class="actions-col">
        <button class="icon-btn" onclick="viewRecord('${record.id}')">
          <span class="material-symbols-outlined">visibility</span>
        </button>
        <button class="icon-btn" onclick="downloadRecord('${record.id}')">
          <span class="material-symbols-outlined">download</span>
        </button>
      </div>
    </div>
  `;
}

function getTypeLabel(type) {
  switch (type) {
    case 'diagnosis':
      return 'Diagnosis';
    case 'prescription':
      return 'Prescription';
    case 'lab':
      return 'Lab Results';
    default:
      return type;
  }
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function showEmptyState() {
  const container = document.getElementById('recordsList');
  container.style.display = 'none';

  const emptyState = document.getElementById('emptyState');
  if (emptyState) {
    emptyState.classList.remove('hidden');
  }
}

function showError(message) {
  const container = document.getElementById('recordsList');
  container.innerHTML = `
    <div style="padding: 2rem; text-align: center; color: #ef4444;">
      <span class="material-symbols-outlined" style="font-size: 48px;">error</span>
      <p style="margin-top: 1rem; font-size: 1.1rem;">${message}</p>
    </div>
  `;
}

let loadedRecords = [];

async function viewRecord(recordId) {
  try {
    let record = loadedRecords.find((r) => r.id === recordId);

    if (!record) {
      const response = await fetch(`http://localhost:8875/records/${recordId}`);
      if (!response.ok) throw new Error('Failed to fetch record');
      record = await response.json();
    }

    document.getElementById('modalTitle').textContent = record.title;
    document.getElementById('modalTypeBadge').textContent = getTypeLabel(
      record.type
    );
    document.getElementById(
      'modalTypeBadge'
    ).className = `record-type-badge badge-${record.type}`;
    document.getElementById('modalDate').textContent = formatDate(record.date);
    document.getElementById('modalDoctorAvatar').src = record.doctorAvatar;
    document.getElementById('modalDoctorName').textContent = record.doctorName;
    document.getElementById(
      'modalDoctorSpec'
    ).textContent = `${record.doctorSpecialization} - ${record.doctorClinic}`;
    document.getElementById('modalDescription').textContent =
      record.description;

    document.getElementById('modalDownloadBtn').onclick = () =>
      downloadRecord(recordId);

    document.getElementById('recordModal').classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  } catch (error) {
    console.error('Error viewing record:', error);
    alert('Failed to load record details.');
  }
}

function closeModal() {
  document.getElementById('recordModal').classList.add('hidden');
  document.body.style.overflow = 'auto';
}

document.addEventListener('keydown', function (e) {
  if (e.key === 'Escape') {
    closeModal();
  }
});

async function downloadRecord(recordId) {
  try {
    let record = loadedRecords.find((r) => r.id === recordId);

    if (!record) {
      const response = await fetch(`http://localhost:8875/records/${recordId}`);
      if (!response.ok) throw new Error('Failed to fetch record');
      record = await response.json();
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    let yPos = 20;

    doc.setFillColor(19, 109, 236);
    doc.rect(0, 0, pageWidth, 40, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('BelShefaa ISA', margin, 25);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Medical Record', margin, 33);

    doc.setTextColor(0, 0, 0);
    yPos = 55;

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    const typeLabel = getTypeLabel(record.type);
    doc.setFillColor(
      getTypeColor(record.type).r,
      getTypeColor(record.type).g,
      getTypeColor(record.type).b
    );
    doc.roundedRect(margin, yPos, 60, 10, 2, 2, 'F');
    doc.setTextColor(255, 255, 255);
    doc.text(typeLabel, margin + 5, yPos + 7);
    doc.setTextColor(0, 0, 0);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(
      `Date: ${formatDate(record.date)}`,
      pageWidth - margin - 50,
      yPos + 7
    );

    yPos += 25;

    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text(record.title, margin, yPos);
    yPos += 15;

    doc.setFillColor(245, 245, 245);
    doc.roundedRect(margin, yPos, pageWidth - 2 * margin, 30, 3, 3, 'F');

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Doctor Information', margin + 5, yPos + 8);

    doc.setFont('helvetica', 'normal');
    doc.text(record.doctorName, margin + 5, yPos + 16);
    doc.setTextColor(100, 100, 100);
    doc.text(
      `${record.doctorSpecialization} - ${record.doctorClinic}`,
      margin + 5,
      yPos + 24
    );
    doc.setTextColor(0, 0, 0);

    yPos += 40;

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Description', margin, yPos);
    yPos += 8;

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');

    const descLines = doc.splitTextToSize(
      record.description,
      pageWidth - 2 * margin
    );
    doc.text(descLines, margin, yPos);
    yPos += descLines.length * 6 + 15;

    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `Generated on ${new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })}`,
      margin,
      280
    );
    doc.text(
      'BelShefaa ISA - Your Health, Our Priority',
      pageWidth - margin - 60,
      280
    );

    const fileName = `${record.title.replace(/[^a-z0-9]/gi, '_')}_${
      record.date
    }.pdf`;
    doc.save(fileName);
  } catch (error) {
    console.error('Error downloading record:', error);
    alert('Failed to download record as PDF.');
  }
}

function getTypeColor(type) {
  switch (type) {
    case 'diagnosis':
      return { r: 239, g: 68, b: 68 }; // red
    case 'prescription':
      return { r: 59, g: 130, b: 246 }; // blue
    case 'lab':
      return { r: 139, g: 92, b: 246 }; // purple
    default:
      return { r: 107, g: 114, b: 128 }; // gray
  }
}

function setupSearch() {
  let input = document.getElementById('searchInput');
  if (!input) return;

  input.onkeyup = function () {
    filterRecords();
  };
}

function setupFilter() {
  let select = document.getElementById('typeFilter');
  if (!select) return;

  select.onchange = function () {
    filterRecords();
  };
}

function filterRecords() {
  let query = document.getElementById('searchInput').value.toLowerCase();
  let type = document.getElementById('typeFilter').value;
  let items = document.querySelectorAll('.record-item');
  let sections = document.querySelectorAll('.doctor-section');
  let empty = document.getElementById('emptyState');
  let list = document.getElementById('recordsList');
  let totalVisible = 0;

  for (let i = 0; i < items.length; i++) {
    let item = items[i];
    let title = item.querySelector('.list-title').textContent.toLowerCase();
    let itemType = item.getAttribute('data-type');
    let show = true;

    if (query && title.indexOf(query) === -1) {
      show = false;
    }
    if (type && itemType !== type) {
      show = false;
    }

    item.style.display = show ? 'table' : 'none';
    if (show) totalVisible++;
  }

  for (let j = 0; j < sections.length; j++) {
    let section = sections[j];
    let visibleItems = section.querySelectorAll(
      '.record-item[style="display: table;"]'
    );
    let hasVisible = false;
    let sectionItems = section.querySelectorAll('.record-item');
    for (let k = 0; k < sectionItems.length; k++) {
      if (sectionItems[k].style.display !== 'none') {
        hasVisible = true;
        break;
      }
    }
    section.style.display = hasVisible ? 'block' : 'none';
  }

  if (totalVisible === 0) {
    list.style.display = 'none';
    empty.className = 'empty-state';
  } else {
    list.style.display = 'block';
    empty.className = 'empty-state hidden';
  }
}
