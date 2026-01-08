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
  let name = sessionStorage.getItem('patientName') || 'John Doe';
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
  if (cookieImage && cookieImage.startsWith('data:')) {
    return cookieImage;
  }

  try {
    let response = await fetch(`http://localhost:8877/users/${userId}`);
    if (!response.ok) {
      throw new Error('Failed to fetch user data');
    }

    let user = await response.json();
    let imageUrl = user.profileImage || '/Src/assets/images/default-avatar.svg';

    if (imageUrl === '/Src/assets/images/default-avatar.svg') {
      return imageUrl;
    }

    return imageUrl;
  } catch (error) {
    console.error('Error fetching profile image:', error);
    return '/Src/assets/images/default-avatar.svg';
  }
}

async function updateUserProfileImage(userId, imageData) {
  let response = await fetch(`http://localhost:8877/users/${userId}`);

  if (!response.ok) {
    throw new Error('Failed to fetch user data');
  }

  let user = await response.json();
  user.profileImage = imageData;

  let updateResponse = await fetch(`http://localhost:8877/users/${userId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(user)
  });

  if (!updateResponse.ok) {
    throw new Error('Failed to update profile image');
  }

  return await updateResponse.json();
}

function setProfileImageCookie(imageData) {
  let d = new Date();
  d.setTime(d.getTime() + (7 * 24 * 60 * 60 * 1000)); // 7 days
  let expires = "expires=" + d.toUTCString();
  document.cookie = "profileImage=" + encodeURIComponent(imageData) + ";" + expires + ";path=/";
}

function getProfileImageCookie() {
  let name = "profileImage=";
  let decodedCookie = decodeURIComponent(document.cookie);
  let ca = decodedCookie.split(';');

  for (let i = 0; i < ca.length; ++i) {
    let c = ca[i];
    while (c.charAt(0) == ' ')
      c = c.substring(1);

    if (c.indexOf(name) == 0)
      return c.substring(name.length, c.length);
  }
  return "";
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
