document.addEventListener('DOMContentLoaded', function () {
  if (!checkAuthenticationAndRedirect()) {
    return;
  }

  buildHeader();
  buildSidebar('profile');
  loadProfile();
  setupForm();
  setupImageUpload();
});

async function loadProfile() {
  let name = sessionStorage.getItem('doctorName') || 'Dr. John Doe';
  let parts = name.split(' ');
  let firstName = parts[0] || 'John';
  let lastName = parts.slice(1).join(' ') || 'Doe';

  let nameEl = document.getElementById('profileName');
  let firstNameEl = document.getElementById('firstName');
  let lastNameEl = document.getElementById('lastName');

  if (nameEl)
    nameEl.textContent = name;
  if (firstNameEl)
    firstNameEl.value = firstName;
  if (lastNameEl)
    lastNameEl.value = lastName;

  // Load other doctor details
  let userId = sessionStorage.getItem('userId');
  let email = sessionStorage.getItem('email');
  let specialization = sessionStorage.getItem('doctorSpecialization') || 'Cardiology';

  if (userId) {
    let doctorIdEl = document.getElementById('doctorId');
    if (doctorIdEl) doctorIdEl.textContent = userId;
  }

  if (email) {
    let emailEl = document.getElementById('email');
    if (emailEl) emailEl.value = email;
  }

  if (specialization) {
    let specializationEl = document.getElementById('specialization');
    if (specializationEl) specializationEl.value = specialization;
  }

  // Load license number from user data
  try {
    let response = await fetch(`http://localhost:3000/users?email=${encodeURIComponent(email)}`);
    if (response.ok) {
      let users = await response.json();
      if (users.length > 0) {
        let doctor = users[0];
        if (doctor.medicalLicenseNo) {
          let licenseEl = document.getElementById('licenseNo');
          if (licenseEl) licenseEl.value = doctor.medicalLicenseNo;
        }
      }
    }
  } catch (error) {
    console.error('Error loading doctor details:', error);
  }

  let avatarEl = document.getElementById('profileAvatar');
  if (avatarEl) {
    let profileImageUrl = await getProfileImageUrl();
    avatarEl.src = profileImageUrl;
  }
}

function setupImageUpload() {
  let editBtn = document.getElementById('editAvatarBtn');
  let fileInput = document.getElementById('profileImageInput');
  let avatarEl = document.getElementById('profileAvatar');

  if (editBtn && fileInput) {
    editBtn.addEventListener('click', function () {
      fileInput.click();
    });

    fileInput.addEventListener('change', async function (e) {
      let file = e.target.files[0];
      if (file) {
        if (!file.type.startsWith('image/')) {
          alert('Please select a valid image file');
          return;
        }

        if (file.size > 5 * 1024 * 1024) { // 5MB limit
          alert('Image size should be less than 5MB');
          return;
        }

        let userId = sessionStorage.getItem('userId');
        if (!userId) {
          alert('User session not found. Please login again.');
          return;
        }

        try {
          let reader = new FileReader();
          reader.onload = async function (event) {
            let imageData = event.target.result;
            avatarEl.src = imageData;

            await updateUserProfileImage(userId, imageData);
            setProfileImageCookie(imageData);

            localStorage.setItem(`imageFile_${userId}`, imageData);

            alert('Profile image updated successfully!');
          };
          reader.readAsDataURL(file);
        } catch (error) {
          console.error('Error uploading profile image:', error);
          alert('Failed to update profile image. Please try again.');
        }
      }
    });
  }
}

async function getProfileImageUrl() {
  let userId = sessionStorage.getItem('userId');
  if (!userId) {
    return '/Src/assets/images/default-avatar.svg';
  }

  let tempImage = localStorage.getItem(`imageFile_${userId}`);
  if (tempImage) {
    return tempImage;
  }

  let cookieImage = getProfileImageCookie();
  if (cookieImage) {
    return cookieImage;
  }

  try {
    let response = await fetch(`http://localhost:3000/users/${userId}`);
    if (response.ok) {
      let user = await response.json();
      if (user.profileImage) {
        return user.profileImage;
      }
    }
  } catch (error) {
    console.error('Error fetching profile image:', error);
  }

  return '/Src/assets/images/default-avatar.svg';
}

function getProfileImageCookie() {
  let name = 'profileImage=';
  let decodedCookie = decodeURIComponent(document.cookie);
  let ca = decodedCookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') {
      c = c.substring(1);
    }
    if (c.indexOf(name) === 0) {
      return c.substring(name.length, c.length);
    }
  }
  return null;
}

function setProfileImageCookie(imageData) {
  let expiryDate = new Date();
  expiryDate.setTime(expiryDate.getTime() + (7 * 24 * 60 * 60 * 1000)); // 7 days
  let expires = "expires=" + expiryDate.toUTCString();
  document.cookie = "profileImage=" + imageData + ";" + expires + ";path=/";
}

async function updateUserProfileImage(userId, imageData) {
  try {
    let response = await fetch(`http://localhost:3000/users/${userId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        profileImage: imageData
      })
    });

    if (!response.ok) {
      throw new Error('Failed to update profile image on server');
    }

    return await response.json();
  } catch (error) {
    console.error('Error updating profile image on server:', error);
    throw error;
  }
}

function setupForm() {
  let form = document.getElementById('profileForm');
  let cancelBtn = document.getElementById('cancelBtn');

  if (cancelBtn) {
    cancelBtn.addEventListener('click', function () {
      loadProfile();
    });
  }

  if (form) {
    form.addEventListener('submit', async function (e) {
      e.preventDefault();

      let firstName = document.getElementById('firstName').value.trim();
      let lastName = document.getElementById('lastName').value.trim();
      let phone = document.getElementById('phone').value.trim();
      let specialization = document.getElementById('specialization').value.trim();
      let currentPassword = document.getElementById('currentPassword').value;
      let newPassword = document.getElementById('newPassword').value;
      let confirmPassword = document.getElementById('confirmPassword').value;

      if (!firstName || !lastName) {
        alert('Please fill in all required fields');
        return;
      }

      if (newPassword || confirmPassword) {
        if (!currentPassword) {
          alert('Please enter your current password');
          return;
        }

        if (newPassword !== confirmPassword) {
          alert('New passwords do not match');
          return;
        }

        if (newPassword.length < 3) {
          alert('Password must be at least 3 characters long');
          return;
        }
      }

      try {
        let userId = sessionStorage.getItem('userId');
        let email = sessionStorage.getItem('email');

        if (!userId || !email) {
          alert('Session expired. Please login again.');
          return;
        }

        // Prepare update data
        let updateData = {
          fullName: `${firstName} ${lastName}`.trim(),
          phone: phone,
          specialization: specialization
        };

        // If password is being changed, verify current password first
        if (newPassword) {
          let storedPassword = sessionStorage.getItem('password');
          let hashedCurrentPassword = await hashPassword(currentPassword);
          
          if (hashedCurrentPassword !== storedPassword) {
            alert('Current password is incorrect');
            return;
          }

          let hashedNewPassword = await hashPassword(newPassword);
          updateData.password = hashedNewPassword;
        }

        // Update user on server
        let response = await fetch(`http://localhost:3000/users/${userId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(updateData)
        });

        if (!response.ok) {
          throw new Error('Failed to update profile');
        }

        // Update session storage
        sessionStorage.setItem('doctorName', updateData.fullName);
        sessionStorage.setItem('doctorSpecialization', specialization);
        if (newPassword) {
          sessionStorage.setItem('password', updateData.password);
        }

        alert('Profile updated successfully!');
        
        // Clear password fields
        document.getElementById('currentPassword').value = '';
        document.getElementById('newPassword').value = '';
        document.getElementById('confirmPassword').value = '';
        
        // Reload profile to show updated data
        loadProfile();
        
        // Reload header to show updated name
        buildHeader();
        
      } catch (error) {
        console.error('Error updating profile:', error);
        alert('Failed to update profile. Please try again.');
      }
    });
  }
}

async function hashPassword(password) {
  let encoder = new TextEncoder();
  let data = encoder.encode(password);
  let hashBuffer = await crypto.subtle.digest('SHA-256', data);
  let hashArray = Array.from(new Uint8Array(hashBuffer));
  let hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}
