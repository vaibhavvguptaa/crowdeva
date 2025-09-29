# Testing Project Settings Functionality

## Overview
This document explains how to test the project settings functionality that stores settings in the database.

## Manual Testing

### Prerequisites
1. Ensure the database is running and accessible
2. Run the migration to create the project settings table:
   ```bash
   npm run db:migrate-settings
   ```
3. Ensure you have a valid project in the database to test with

### Testing the API Endpoints

#### 1. Fetching Project Settings
To test fetching project settings:
1. Start the development server: `npm run dev`
2. Authenticate as a user with manager, admin, or owner role for a project
3. Make a GET request to `/api/dashboard/[projectId]/settings` where `[projectId]` is a valid project ID
4. Verify that the response contains the settings data

#### 2. Updating Project Settings
To test updating project settings:
1. Start the development server: `npm run dev`
2. Authenticate as a user with manager, admin, or owner role for a project
3. Make a PUT request to `/api/dashboard/[projectId]/settings` with a JSON body containing the settings:
   ```json
   {
     "general": {
       "projectName": "Updated Project Name",
       "description": "Updated description",
       "autoSave": true,
       "taskTimeout": 45
     },
     "notifications": {
       "emailNotifications": true,
       "pushNotifications": false,
       "taskAssignments": true,
       "issueAlerts": true,
       "weeklyReports": true,
       "systemUpdates": false
     },
     "privacy": {
       "dataRetention": "1-year",
       "anonymizeData": true,
       "shareAnalytics": false,
       "publicProfile": false
     },
     "team": {
       "maxAnnotators": 15,
       "requireApproval": false,
       "allowGuestAccess": true,
       "defaultRole": "reviewer",
       "enableSubAdmins": false,
       "subAdminPermissions": {
         "manageTeam": false,
         "viewAnalytics": true,
         "exportData": true,
         "manageSettings": false
       }
     },
     "vendor": {
       "enableVendorOnboarding": false,
       "requireDocumentVerification": false,
       "autoApproveVerified": true,
       "onboardingSteps": [
         "profile_completion",
         "document_upload"
       ]
     }
   }
   ```
4. Verify that the response indicates success
5. Make another GET request to verify the settings were updated

### Database Verification
To verify that settings are properly stored in the database:

1. Connect to your MySQL database
2. Run the following query to check if settings are stored:
   ```sql
   SELECT * FROM project_settings WHERE project_id = 'YOUR_PROJECT_ID';
   ```
3. Verify that the JSON fields contain the expected settings data

## Automated Testing
To run automated tests for the project settings functionality:

1. Ensure the test database is configured properly
2. Run the tests:
   ```bash
   npm run test
   ```

Note: The project settings functionality includes unit tests for the database queries in the `test/api/` directory.

## Troubleshooting

### Common Issues

1. **Database Connection Errors**
   - Verify that the database is running
   - Check that the database connection parameters in your environment variables are correct
   - Ensure the database user has the necessary permissions

2. **Migration Errors**
   - Ensure you're running the migration command from the project root directory
   - Check that the migration file exists at `src/lib/db/migrations/001_create_project_settings_table.sql`
   - Verify that the database user has CREATE TABLE permissions

3. **Authentication Errors**
   - Ensure you're authenticated as a user with the appropriate role (manager, admin, or owner)
   - Verify that the user has access to the project

4. **Data Not Persisting**
   - Check that the project_settings table was created successfully
   - Verify that the API endpoint is correctly calling the database functions
   - Ensure that the database connection is working properly