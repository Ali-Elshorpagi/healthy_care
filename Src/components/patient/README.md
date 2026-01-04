# Patient Module

This module contains all patient-related pages and components for the BelShefaa ISA application.

## Structure

```
patient/
├── dashboard/
│   ├── dashboard.html    # Patient home page with stats and appointments
│   ├── dashboard.css     # Dashboard-specific styles
│   └── dashboard.js      # Dashboard functionality
├── appointments/
│   ├── appointments.html # Appointments listing and management
│   ├── appointments.css  # Appointments-specific styles
│   └── appointments.js   # Appointments filtering and actions
├── medical-records/
│   ├── medical-records.html  # Medical records grouped by specialty
│   ├── medical-records.css   # Medical records styles
│   └── medical-records.js    # Search and filter functionality
├── profile/
│   ├── profile.html      # Patient profile and settings
│   ├── profile.css       # Profile page styles
│   └── profile.js        # Profile form handling
└── shared/
    ├── sidebar.css       # Shared sidebar and layout styles
    └── sidebar.js        # Reusable sidebar component
```

## Reusable Sidebar

The sidebar is now a reusable component. All pages use the same sidebar configuration from `shared/sidebar.js`.

### Menu Items

The sidebar displays four main menu items:

- Dashboard
- Appointments
- Medical Records
- Profile

### Adding Custom Icons

To add your custom icons, edit the `SIDEBAR_CONFIG` object in `shared/sidebar.js`:

```javascript
const SIDEBAR_CONFIG = {
  logo: {
    icon: '../path/to/your/logo-icon.png', // Your logo icon
    text: 'BelShefaa ISA',
  },
  menuItems: [
    {
      id: 'dashboard',
      label: 'Dashboard',
      href: '../dashboard/dashboard.html',
      icon: '../path/to/your/dashboard-icon.png', // Your dashboard icon
    },
    {
      id: 'appointments',
      label: 'Appointments',
      href: '../appointments/appointments.html',
      icon: '../path/to/your/appointments-icon.png', // Your appointments icon
    },
    {
      id: 'medical-records',
      label: 'Medical Records',
      href: '../medical-records/medical-records.html',
      icon: '../path/to/your/records-icon.png', // Your medical records icon
    },
    {
      id: 'profile',
      label: 'Profile',
      href: '../profile/profile.html',
      icon: '../path/to/your/profile-icon.png', // Your profile icon
    },
  ],
  logout: {
    icon: '../path/to/your/logout-icon.png', // Your logout icon
    label: 'Logout',
  },
};
```

### How It Works

1. Each HTML page includes the shared sidebar script:

   ```html
   <script src="../shared/sidebar.js"></script>
   ```

2. Each page's JavaScript initializes the sidebar with its page ID:

   ```javascript
   initSidebar('dashboard'); // For dashboard page
   initSidebar('appointments'); // For appointments page
   initSidebar('medical-records'); // For medical records page
   initSidebar('profile'); // For profile page
   ```

3. The sidebar automatically highlights the active menu item based on the page ID.

### Icon Styling

Icons are rendered as `<img>` elements with the class `menu-icon-img`. You can customize their appearance in `shared/sidebar.css`:

```css
.menu-icon-img {
  width: 20px;
  height: 20px;
  margin-right: 12px;
  vertical-align: middle;
}

.logo-icon-img {
  width: 32px;
  height: 32px;
  margin-right: 10px;
  vertical-align: middle;
}
```

## Pages

### Dashboard

- Welcome message with patient name
- Search functionality for doctors and clinics
- Statistics cards (patients, doctors, clinics)
- Upcoming appointments list
- Featured clinics section

### Appointments

- List all appointments with status badges
- Filter by status (All, Upcoming, Completed, Cancelled)
- Sort functionality
- Book new appointment button
- Reschedule and cancel actions

### Medical Records

- Records grouped by medical specialty
- Doctor information with contact option
- Different record types (PDF, Notes, Lab Results, Immunization)
- View and download options
- Search and filter functionality

### Profile

- Profile photo management
- Personal information form (name, email, phone, DOB, gender)
- Password and security settings
- Form validation

## Usage

Open any HTML file directly in a browser to view the page:

```
dashboard/dashboard.html
appointments/appointments.html
medical-records/medical-records.html
profile/profile.html
```
