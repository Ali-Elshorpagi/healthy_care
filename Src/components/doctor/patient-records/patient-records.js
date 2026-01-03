let API_URL = 'http://localhost:3000';
let currentDoctorId = sessionStorage.getItem('userId');
let currentPatientId = null;
let allPatients = [];

document.addEventListener('DOMContentLoaded', function() {
    loadPatients();
    setupSearchFilter();
    setupAddRecordForm();
});

async function loadPatients() {
    try {
        let patientsGrid = document.getElementById('patientsGrid');
        patientsGrid.innerHTML = '<div class="loading">Loading patients...</div>';

        let appointmentsRes = await fetch(`${API_URL}/appointments`);
        let appointments = await appointmentsRes.json();

        let acceptedAppointments = appointments.filter(apt => 
            apt.doctorId === currentDoctorId && apt.status === 'accepted'
        );

        if (acceptedAppointments.length === 0) {
            patientsGrid.innerHTML = `
                <div class="empty-state">
                    <span class="material-symbols-outlined">person_off</span>
                    <p>No patients with accepted appointments yet</p>
                </div>
            `;
            return;
        }

        let patientIds = [...new Set(acceptedAppointments.map(apt => apt.patientId))];
        let usersRes = await fetch(`${API_URL}/users`);
        let users = await usersRes.json();
        let recordsRes = await fetch(`${API_URL}/records`);
        let allRecords = await recordsRes.json();
        allPatients = users.filter(user => patientIds.includes(user.id));
        displayPatients(allPatients, acceptedAppointments, allRecords);

    } catch (error) {
        console.error('Error loading patients:', error);
        let patientsGrid = document.getElementById('patientsGrid');
        patientsGrid.innerHTML = `
            <div class="empty-state">
                <p style="color: #dc2626;">Error loading patients. Please try again.</p>
            </div>
        `;
    }
}

function displayPatients(patients, appointments, allRecords) {
    let patientsGrid = document.getElementById('patientsGrid');
    
    if (patients.length === 0) {
        patientsGrid.innerHTML = `
            <div class="empty-state">
                <span class="material-symbols-outlined">person_off</span>
                <p>No patients found</p>
            </div>
        `;
        return;
    }

    patientsGrid.innerHTML = patients.map(patient => {
        let patientAppointments = appointments.filter(apt => apt.patientId === patient.id);
        let patientRecords = allRecords.filter(rec => rec.patientId === patient.id);
        let initials = patient.fullName.split(' ').map(n => n[0]).join('');

        return `
            <div class="patient-card">
                <div class="patient-header">
                    <div class="patient-avatar">${initials}</div>
                    <div class="patient-info">
                        <h3>${patient.fullName}</h3>
                        <p>${patient.email}</p>
                    </div>
                </div>
                <div class="patient-stats">
                    <div class="stat-item">
                        <span class="stat-label">Appointments</span>
                        <span class="stat-value">${patientAppointments.length}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Records</span>
                        <span class="stat-value">${patientRecords.length}</span>
                    </div>
                </div>
                <div class="patient-actions">
                    <button class="btn-view-records" onclick="viewPatientRecords('${patient.id}', '${patient.fullName}')">
                        <span class="material-symbols-outlined">folder_open</span>
                        View Records
                    </button>
                    <button class="btn-add-record" onclick="openAddRecordModal('${patient.id}')">
                        <span class="material-symbols-outlined">add</span>
                        Add Record
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

function setupSearchFilter() {
    let searchInput = document.getElementById('searchInput');
    searchInput.addEventListener('input', function(e) {
        let searchTerm = e.target.value.toLowerCase();
        let filteredPatients = allPatients.filter(patient => 
            patient.fullName.toLowerCase().includes(searchTerm) ||
            patient.email.toLowerCase().includes(searchTerm)
        );
        
        loadPatients().then(() => {
            let patientsGrid = document.getElementById('patientsGrid');
            if (searchTerm) {
                let cards = patientsGrid.querySelectorAll('.patient-card');
                cards.forEach(card => {
                    let name = card.querySelector('h3').textContent.toLowerCase();
                    let email = card.querySelector('p').textContent.toLowerCase();
                    if (!name.includes(searchTerm) && !email.includes(searchTerm)) {
                        card.style.display = 'none';
                    }
                });
            }
        });
    });
}

function openAddRecordModal(patientId) {
    currentPatientId = patientId;
    document.getElementById('recordPatientId').value = patientId;
    document.getElementById('addRecordModal').classList.add('active');
    let today = new Date().toISOString().split('T')[0];
    document.getElementById('recordDate').value = today;
}

function closeAddRecordModal() {
    document.getElementById('addRecordModal').classList.remove('active');
    document.getElementById('addRecordForm').reset();
    currentPatientId = null;
}

function setupAddRecordForm() {
    let form = document.getElementById('addRecordForm');
    form.addEventListener('submit', async function(e) {
        e.preventDefault();

        let recordType = document.getElementById('recordType').value;
        let recordTitle = document.getElementById('recordTitle').value;
        let recordDescription = document.getElementById('recordDescription').value;
        let recordDate = document.getElementById('recordDate').value;
        let patientId = document.getElementById('recordPatientId').value;
        let doctorName = sessionStorage.getItem('doctorName') || 'Doctor';
        let doctorSpecialization = sessionStorage.getItem('doctorSpecialization') || 'Specialist';

        let iconMap = {
            'diagnosis': 'favorite',
            'prescription': 'medication',
            'lab': 'science'
        };

        let colorMap = {
            'diagnosis': 'red',
            'prescription': 'blue',
            'lab': 'purple'
        };

        let newRecord = {
            id: `rec_${Date.now()}`,
            patientId: patientId,
            doctorId: currentDoctorId,
            doctorName: doctorName,
            doctorSpecialization: doctorSpecialization,
            type: recordType,
            title: recordTitle,
            description: recordDescription,
            date: recordDate,
            icon: iconMap[recordType],
            iconColor: colorMap[recordType]
        };

        try {
            let response = await fetch(`${API_URL}/records`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(newRecord)
            });

            if (response.ok) {
                alert('Medical record added successfully!');
                closeAddRecordModal();
                loadPatients();
            } else {
                alert('Failed to add medical record. Please try again.');
            }
        } catch (error) {
            console.error('Error adding record:', error);
            alert('Error adding medical record. Please try again.');
        }
    });
}

async function viewPatientRecords(patientId, patientName) {
    try {
        document.getElementById('patientNameTitle').textContent = `${patientName}'s Records`;
        document.getElementById('viewRecordsModal').classList.add('active');
        document.getElementById('recordsList').innerHTML = '<div class="loading">Loading records...</div>';

        let response = await fetch(`${API_URL}/records`);
        let allRecords = await response.json();
        
        let patientRecords = allRecords.filter(rec => rec.patientId === patientId);

        if (patientRecords.length === 0) {
            document.getElementById('recordsList').innerHTML = `
                <div class="empty-state">
                    <span class="material-symbols-outlined">folder_off</span>
                    <p>No medical records found for this patient</p>
                </div>
            `;
            return;
        }
        patientRecords.sort((a, b) => new Date(b.date) - new Date(a.date));

        let recordsHTML = patientRecords.map(record => `
            <div class="record-item">
                <div class="record-header">
                    <span class="record-type ${record.type}">
                        <span class="material-symbols-outlined">${record.icon}</span>
                        ${record.type.charAt(0).toUpperCase() + record.type.slice(1)}
                    </span>
                    <span class="record-date">${new Date(record.date).toLocaleDateString()}</span>
                </div>
                <h3 class="record-title">${record.title}</h3>
                <p class="record-description">${record.description}</p>
                ${record.doctorName ? `<p style="margin-top: 0.75rem; font-size: 0.75rem; color: #999;">By: ${record.doctorName} - ${record.doctorSpecialization}</p>` : ''}
            </div>
        `).join('');

        document.getElementById('recordsList').innerHTML = recordsHTML;

    } catch (error) {
        console.error('Error loading records:', error);
        document.getElementById('recordsList').innerHTML = `
            <div class="empty-state">
                <p style="color: #dc2626;">Error loading records. Please try again.</p>
            </div>
        `;
    }
}

function closeViewRecordsModal() {
    document.getElementById('viewRecordsModal').classList.remove('active');
}

window.addEventListener('click', function(e) {
    if (e.target.classList.contains('modal')) {
        e.target.classList.remove('active');
    }
});
