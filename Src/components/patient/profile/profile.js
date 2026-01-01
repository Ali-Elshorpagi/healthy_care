document.addEventListener('DOMContentLoaded', function () {
  buildHeader();
  buildSidebar('profile');
  loadProfile();
  setupForm();
});

function loadProfile() {
  let name = sessionStorage.getItem('patientName') || 'John Doe';
  let parts = name.split(' ');
  let firstName = parts[0] || 'John';
  let lastName = parts.slice(1).join(' ') || 'Doe';

  let nameEl = document.getElementById('profileName');
  let firstNameEl = document.getElementById('firstName');
  let lastNameEl = document.getElementById('lastName');

  if (nameEl) nameEl.textContent = name;
  if (firstNameEl) firstNameEl.value = firstName;
  if (lastNameEl) lastNameEl.value = lastName;
}

function setupForm() {
  let form = document.getElementById('profileForm');
  let cancelBtn = document.getElementById('cancelBtn');

  if (form) {
    form.onsubmit = function (e) {
      e.preventDefault();
      let firstName = document.getElementById('firstName').value;
      let lastName = document.getElementById('lastName').value;
      sessionStorage.setItem('patientName', firstName + ' ' + lastName);
      alert('Profile updated successfully!');
      loadProfile();
    };
  }

  if (cancelBtn) {
    cancelBtn.onclick = function () {
      loadProfile();
    };
  }
}
