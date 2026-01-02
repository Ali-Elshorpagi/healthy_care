document.addEventListener('DOMContentLoaded', function () {
  buildHeader();
  buildSidebar('dashboard');
  loadPatientInfo();
});

function loadPatientInfo() {
  let name = sessionStorage.getItem('patientName') || 'Sarah';
  let firstName = name.split(' ')[0];
  let welcome = document.getElementById('welcomeText');
  if (welcome) {
    welcome.textContent = 'Welcome Back, ' + firstName;
  }
}

let searchBtn = document.getElementById('searchBtn');
if (searchBtn) {
  searchBtn.onclick = function () {
    let query = document.getElementById('searchInput').value;
    let type = document.getElementById('clinicTypeSelect').value;
    console.log('Searching:', query, type);
  };
}
