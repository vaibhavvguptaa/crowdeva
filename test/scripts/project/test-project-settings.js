#!/usr/bin/env node

// Simple test script for project settings functionality
const mysql = require('mysql2/promise');

async function testProjectSettings() {
  let connection;
  
  try {
    // Create database connection
    connection = await mysql.createConnection({
      host: process.env.MYSQL_HOST || 'localhost',
      port: process.env.MYSQL_PORT || 3306,
      user: process.env.MYSQL_USER || 'root',
      password: process.env.MYSQL_PASSWORD || 'password',
      database: process.env.MYSQL_DATABASE || 'llm_evaluation'
    });
    
    console.log('✓ Connected to database');
    
    // Test creating project settings
    const projectId = 'test-project-id';
    const settings = {
      general: {
        projectName: 'Test Project',
        description: 'Test Description',
        autoSave: true,
        taskTimeout: 30
      },
      notifications: {
        emailNotifications: true,
        pushNotifications: false,
        taskAssignments: true,
        issueAlerts: true,
        weeklyReports: true,
        systemUpdates: false
      },
      privacy: {
        dataRetention: '2-years',
        anonymizeData: false,
        shareAnalytics: true,
        publicProfile: false
      },
      team: {
        maxAnnotators: 10,
        requireApproval: true,
        allowGuestAccess: false,
        defaultRole: 'annotator',
        enableSubAdmins: true,
        subAdminPermissions: {
          manageTeam: true,
          viewAnalytics: true,
          exportData: false,
          manageSettings: false
        }
      },
      vendor: {
        enableVendorOnboarding: true,
        requireDocumentVerification: true,
        autoApproveVerified: false,
        onboardingSteps: [
          'profile_completion',
          'document_upload',
          'capability_assessment',
          'compliance_review',
          'final_approval'
        ]
      }
    };
    
    // Create or update project settings
    const createQuery = `
      INSERT INTO project_settings (project_id, general_settings, notification_settings, privacy_settings, team_settings, vendor_settings)
      VALUES (?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
      general_settings = VALUES(general_settings),
      notification_settings = VALUES(notification_settings),
      privacy_settings = VALUES(privacy_settings),
      team_settings = VALUES(team_settings),
      vendor_settings = VALUES(vendor_settings),
      updated_at = CURRENT_TIMESTAMP
    `;
    
    await connection.execute(createQuery, [
      projectId,
      JSON.stringify(settings.general),
      JSON.stringify(settings.notifications),
      JSON.stringify(settings.privacy),
      JSON.stringify(settings.team),
      JSON.stringify(settings.vendor)
    ]);
    
    console.log('✓ Created/updated project settings');
    
    // Retrieve project settings
    const [rows] = await connection.execute(
      'SELECT * FROM project_settings WHERE project_id = ?',
      [projectId]
    );
    
    if (rows.length > 0) {
      console.log('✓ Retrieved project settings from database');
      console.log('General settings:', JSON.parse(rows[0].general_settings));
      console.log('Team settings:', JSON.parse(rows[0].team_settings));
    } else {
      console.log('✗ Failed to retrieve project settings');
    }
    
    // Clean up test data
    await connection.execute(
      'DELETE FROM project_settings WHERE project_id = ?',
      [projectId]
    );
    
    console.log('✓ Cleaned up test data');
    
    console.log('\n🎉 All tests passed!');
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Run test
testProjectSettings();