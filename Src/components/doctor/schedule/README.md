# Doctor Availability & Patient Booking System

## Overview
This feature allows doctors to set their weekly availability schedule, and patients can only book appointments during the doctor's available time periods.

## What's New

### For Doctors
- **Schedule Management Page**: A new page where doctors can set their availability
- Accessible via the sidebar menu item "My Schedule"
- Weekly calendar view showing all availability slots
- Add, edit, and delete availability slots for each day of the week
- Set specific time ranges (e.g., 9:00 AM - 5:00 PM)
- Mark slots as available or unavailable

### For Patients
- **Enhanced Booking Validation**: The booking system now validates appointments against doctor schedules
- Patients receive immediate feedback if they select a date/time when the doctor is unavailable
- Shows available time ranges when validation fails
- Prevents booking outside of doctor's working hours

## Files Modified/Created

### New Files
1. **Src/database/schedules.json** - Database for storing doctor availability schedules
2. **Src/components/doctor/schedule/schedule.html** - Doctor schedule management UI
3. **Src/components/doctor/schedule/schedule.css** - Styling for schedule page
4. **Src/components/doctor/schedule/schedule.js** - Schedule management logic

### Modified Files
1. **start-json-servers.bat** - Added schedules API server on port 8873
2. **Src/components/doctor/shared/sidebar.js** - Added "My Schedule" menu item
3. **Src/components/patient/appointments/book-appointment.js** - Added availability validation

## Database Schema

### Schedules Collection
```json
{
  "id": "sch_1234567890",
  "doctorId": "d_1234567890",
  "dayOfWeek": "Monday",
  "startTime": "09:00",
  "endTime": "17:00",
  "isAvailable": true
}
```

## API Endpoints

The new schedules API runs on **port 8873**:
- `GET http://localhost:8873/schedules` - Get all schedules
- `GET http://localhost:8873/schedules?doctorId={id}` - Get schedules for a specific doctor
- `GET http://localhost:8873/schedules?doctorId={id}&dayOfWeek={day}` - Filter by day
- `POST http://localhost:8873/schedules` - Create new schedule
- `PATCH http://localhost:8873/schedules/{id}` - Update schedule
- `DELETE http://localhost:8873/schedules/{id}` - Delete schedule

## How to Use

### Starting the System
Run the updated batch file to start all servers including the new schedules server:
```batch
start-json-servers.bat
```

### For Doctors

1. **Login** as a doctor
2. Navigate to **"My Schedule"** from the sidebar
3. Click **"Add Availability"** button
4. Select:
   - Day of week
   - Start time
   - End time
   - Availability status (checked = available)
5. Click **"Save Schedule"**
6. The schedule appears in the weekly calendar view
7. Edit or delete slots as needed using the icons on each time slot

**Best Practices:**
- Set regular weekly schedules for consistency
- Add breaks between long consultation periods
- Update schedule in advance when taking time off

### For Patients

1. **Login** as a patient
2. Navigate to **"Book Appointment"**
3. Select clinic and doctor
4. Choose a date
   - System validates if doctor works on that day
   - Shows error if doctor is unavailable on selected day
5. Choose a time
   - System validates if time falls within doctor's working hours
   - Shows available hours if selection is invalid
6. Complete booking

**Validation Messages:**
- "Doctor is not available on [Day]s. Please select another date."
- "Selected time is outside doctor's availability. Available times: [times]"
- "The selected time is not within the doctor's available hours."

## Features

### Doctor Schedule Management
✅ Visual weekly calendar view
✅ Add multiple time slots per day
✅ Edit existing schedules
✅ Delete schedules
✅ Mark slots as available/unavailable
✅ Real-time feedback with success/error messages
✅ Responsive design for mobile and desktop

### Patient Booking Validation
✅ Real-time date validation against doctor schedule
✅ Real-time time validation against working hours
✅ Clear error messages with available times
✅ Prevents booking outside doctor's availability
✅ Works with existing appointment conflict checking

## Technical Details

### Schedule Validation Logic
1. When patient selects a date, system determines the day of week
2. Queries schedules API for doctor's availability on that day
3. If no schedules found, date selection is rejected
4. When patient enters a time, validates it falls within available time ranges
5. Final validation occurs on form submission before creating appointment

### Time Format
- Schedule times stored in 24-hour format (HH:MM)
- Display uses 12-hour format with AM/PM
- Compatible with HTML5 time input

### Data Flow
```
Doctor creates schedule → Saved to schedules.json → 
Patient selects date/time → Validates against schedules → 
Creates appointment if valid
```

## Troubleshooting

### Schedule Server Not Starting
- Ensure port 8873 is not in use
- Check that Src/database/schedules.json exists
- Verify json-server is installed globally

### Validation Not Working
- Ensure schedules server is running (http://localhost:8873)
- Check browser console for API errors
- Verify doctor has created schedules for the selected day

### Schedule Not Appearing
- Refresh the schedule page
- Check that doctorId matches between schedules and appointments
- Verify schedules have isAvailable: true

## Future Enhancements
- Bulk schedule creation (set schedule for entire week)
- Copy schedule from one week to another
- Holiday/vacation management
- Slot duration settings (15, 30, 60 minutes)
- Automated slot generation within time ranges
- Schedule templates (morning shift, evening shift, etc.)
- Patient view of doctor availability before selecting date
- Visual time picker showing only available slots
