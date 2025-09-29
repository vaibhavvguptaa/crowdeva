# Settings Tab Backend Integration

## Overview
This document explains the backend integration implemented for the Settings tab in the project dashboard. The integration allows the Settings tab to fetch and save real data from the backend instead of using mock data.

## Changes Made

### 1. API Endpoint Creation
A new API endpoint was created at `/api/dashboard/[projectId]/settings` with the following functionality:

- **GET** method to fetch settings data for a specific project
- **PUT** method to update settings data for a specific project
- Authentication and authorization checks to ensure only authorized users can access settings
- Role-based access control (only managers, admins, and owners can access settings)

### 2. SettingsTab Component Updates
The SettingsTab component was updated to:

- Accept a `projectId` prop
- Fetch settings data from the backend when the component mounts
- Display a loading spinner while fetching data
- Save settings data to the backend when the "Save Changes" button is clicked
- Show saving state with a spinner during save operations
- Handle errors appropriately

### 3. Dashboard Page Updates
The dashboard page was updated to pass the `projectId` to the SettingsTab component, consistent with how other tabs receive this prop.

## Implementation Details

### API Route
The API route at `src/app/api/dashboard/[projectId]/settings/route.ts` handles both GET and PUT requests:

- **GET**: Fetches project data and returns it in the settings format
- **PUT**: Updates project data based on the settings provided

### SettingsTab Component
The SettingsTab component now:

1. Uses `useEffect` to fetch settings data when `projectId` is available
2. Displays a loading state while fetching data
3. Sends PUT requests to save settings data
4. Shows saving state during save operations
5. Handles errors gracefully

### Data Flow
1. SettingsTab component mounts with projectId prop
2. useEffect hook triggers fetchSettingsData function
3. Component makes GET request to `/api/dashboard/[projectId]/settings`
4. API route validates user authentication and authorization
5. API route fetches project data and formats it as settings
6. Settings data is returned to the component and displayed
7. User makes changes to settings
8. User clicks "Save Changes"
9. Component makes PUT request to `/api/dashboard/[projectId]/settings` with updated settings
10. API route validates user authentication and authorization
11. API route updates project data based on settings
12. Success or error response is returned to component
13. User is notified of the result

## Security Considerations
- All API endpoints require authentication
- Role-based access control ensures only authorized users can access settings
- Project-level access control ensures users can only access projects they belong to
- Input validation is performed on all data before processing

## Future Improvements
- Add more specific settings storage in the database rather than using default values
- Implement more granular permissions for different settings sections
- Add audit logging for settings changes
- Implement real-time updates for settings changes