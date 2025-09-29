"use client";

import React, { useState } from 'react';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/Ui/card'; 
import { withAuth } from '@/lib/auth';
import Header from '@/components/Ui/header';
import { 
  Save, 
  Settings,
  Users,
  Shield,
  Bell,
  Mail,
  Smartphone,
  Database,
  Lock,
  Eye,
  UserPlus,
  Pause,
  Play,
  AlertTriangle
} from 'lucide-react';

interface VendorTeamMember {
  id: number;
  name: string;
  email: string;
  role: 'team-lead' | 'developer' | 'qa-specialist' | 'project-manager';
  status: 'active' | 'paused';
  invitedAt: string;
  lastActivity?: string;
  permissions: {
    canEditEvaluations: boolean;
    canViewAnalytics: boolean;
    canInviteMembers: boolean;
    canManageProjects: boolean;
  };
}

function VendorSettingsPage() {
  const [activeSection, setActiveSection] = useState('team');
  
  // Vendor-specific settings
  const [settings, setSettings] = useState({
    general: {
      companyName: 'TechVendor Solutions',
      businessType: 'AI Development',
      maxTeamSize: 15,
      autoAssignTasks: true,
      requireClientApproval: true
    },
    notifications: {
      emailNotifications: true,
      projectUpdates: true,
      taskAssignments: true,
      clientFeedback: true,
      teamActivity: true,
      deadlineReminders: true
    },
    privacy: {
      dataRetention: '2-years',
      shareAnalytics: true,
      clientVisibility: 'limited',
      teamDataAccess: 'restricted'
    },
    team: {
      maxMembers: 15,
      requireApproval: true,
      allowSubcontractors: false,
      defaultRole: 'developer'
    }
  });

  // Mock vendor team members with enhanced status tracking
  const [teamMembers, setTeamMembers] = useState<VendorTeamMember[]>([
    { 
      id: 1, 
      name: 'Sarah Chen', 
      email: 'sarah.chen@techvendor.com', 
      role: 'team-lead',
      status: 'active',
      invitedAt: '2024-01-15',
      lastActivity: '2 hours ago',
      permissions: {
        canEditEvaluations: true,
        canViewAnalytics: true,
        canInviteMembers: true,
        canManageProjects: true
      }
    },
    { 
      id: 2, 
      name: 'Mike Rodriguez', 
      email: 'mike.r@techvendor.com', 
      role: 'developer',
      status: 'active',
      invitedAt: '2024-01-20',
      lastActivity: '1 day ago',
      permissions: {
        canEditEvaluations: true,
        canViewAnalytics: false,
        canInviteMembers: false,
        canManageProjects: false
      }
    },
    { 
      id: 3, 
      name: 'Emma Wilson', 
      email: 'emma.wilson@techvendor.com', 
      role: 'qa-specialist',
      status: 'paused',
      invitedAt: '2024-01-10',
      lastActivity: '1 week ago',
      permissions: {
        canEditEvaluations: false,
        canViewAnalytics: true,
        canInviteMembers: false,
        canManageProjects: false
      }
    }
  ]);

  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberRole, setNewMemberRole] = useState<VendorTeamMember['role']>('developer');

  const settingSections = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'team', label: 'Team Management', icon: Users },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'privacy', label: 'Privacy & Access', icon: Shield },
  ];

  const handleSettingChange = (section: string, key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section as keyof typeof prev],
        [key]: value
      }
    }));
  };

  const handleSave = () => {
    console.log('Saving vendor settings...', settings);
    alert('Vendor settings saved successfully!');
  };

  const handleInviteMember = () => {
    if (newMemberEmail && !teamMembers.find(m => m.email === newMemberEmail)) {
      const newMember: VendorTeamMember = {
        id: Date.now(),
        name: 'Pending Invitation',
        email: newMemberEmail,
        role: newMemberRole,
        status: 'active',
        invitedAt: new Date().toISOString().split('T')[0],
        permissions: {
          canEditEvaluations: newMemberRole === 'team-lead' || newMemberRole === 'developer',
          canViewAnalytics: newMemberRole === 'team-lead' || newMemberRole === 'qa-specialist',
          canInviteMembers: newMemberRole === 'team-lead',
          canManageProjects: newMemberRole === 'team-lead' || newMemberRole === 'project-manager'
        }
      };
      setTeamMembers([...teamMembers, newMember]);
      setNewMemberEmail('');
      setNewMemberRole('developer');
      
      // In real implementation, send invitation email here
      console.log(`Invitation sent to ${newMemberEmail} for role: ${newMemberRole}`);
    }
  };

  // Pause/Resume member instead of removing them completely
  const handleToggleMemberStatus = (id: number) => {
    setTeamMembers(members => 
      members.map(member => 
        member.id === id 
          ? { ...member, status: member.status === 'active' ? 'paused' : 'active' }
          : member
      )
    );
  };

  const renderGeneralSettings = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader title="Vendor Information" />
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Company Name
              </label>
              <input
                type="text"
                value={settings.general.companyName}
                onChange={(e) => handleSettingChange('general', 'companyName', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 text-gray-800 focus:ring-green-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Business Type
              </label>
              <select
                value={settings.general.businessType}
                onChange={(e) => handleSettingChange('general', 'businessType', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 text-gray-800 focus:ring-green-500"
              >
                <option value="AI Development">AI Development</option>
                <option value="Data Annotation">Data Annotation</option>
                <option value="Model Training">Model Training</option>
                <option value="Quality Assurance">Quality Assurance</option>
                <option value="Consulting">Consulting</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Maximum Team Size
              </label>
              <input
                type="number"
                value={settings.general.maxTeamSize}
                onChange={(e) => handleSettingChange('general', 'maxTeamSize', parseInt(e.target.value))}
                min="5"
                max="50"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 text-gray-800 focus:ring-green-500"
              />
            </div>

            <div className="space-y-3">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.general.autoAssignTasks}
                  onChange={(e) => handleSettingChange('general', 'autoAssignTasks', e.target.checked)}
                  className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                />
                <span className="ml-2 text-sm text-gray-700">Auto-assign tasks to team members</span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.general.requireClientApproval}
                  onChange={(e) => handleSettingChange('general', 'requireClientApproval', e.target.checked)}
                  className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                />
                <span className="ml-2 text-sm text-gray-700">Require client approval for deliverables</span>
              </label>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderTeamSettings = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader title="Team Configuration" />
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Maximum Team Members
              </label>
              <input
                type="number"
                value={settings.team.maxMembers}
                onChange={(e) => handleSettingChange('team', 'maxMembers', parseInt(e.target.value))}
                min="1"
                max="50"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none text-gray-800 focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Default Role for New Members
              </label>
              <select
                value={settings.team.defaultRole}
                onChange={(e) => handleSettingChange('team', 'defaultRole', e.target.value)}
                className="w-full px-3 py-2 border text-gray-800 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="developer">Developer</option>
                <option value="qa-specialist">QA Specialist</option>
                <option value="project-manager">Project Manager</option>
                <option value="team-lead">Team Lead</option>
              </select>
            </div>

            <div className="space-y-3">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.team.requireApproval}
                  onChange={(e) => handleSettingChange('team', 'requireApproval', e.target.checked)}
                  className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                />
                <span className="ml-2 text-sm text-gray-700">Require approval for new team members</span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.team.allowSubcontractors}
                  onChange={(e) => handleSettingChange('team', 'allowSubcontractors', e.target.checked)}
                  className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                />
                <span className="ml-2 text-sm text-gray-700">Allow subcontractor invitations</span>
              </label>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader 
          title="Team Members" 
          subtitle="Manage your vendor team and their access permissions. Note: Members can be paused but not completely removed to maintain project evaluation integrity."
        />
        <CardContent>
          <ul className="space-y-3">
            {teamMembers.map(member => (
              <li key={member.id} className={`flex items-center justify-between p-3 rounded-md border transition-all ${
                member.status === 'paused' 
                  ? 'bg-red-50 border-red-200' 
                  : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
              }`}>
                <div className="flex items-center flex-1">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 ${
                    member.status === 'paused' ? 'bg-red-200' : 'bg-green-200'
                  }`}>
                    <span className={`text-sm font-bold ${
                      member.status === 'paused' ? 'text-red-700' : 'text-green-700'
                    }`}>
                      {member.name.charAt(0)}
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-gray-900">{member.name}</p>
                      {member.status === 'paused' && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          <Pause className="w-3 h-3 mr-1" />
                          Paused
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500">{member.email}</p>
                    <div className="flex items-center gap-4 mt-1">
                      <span className="text-xs text-gray-600 capitalize">{member.role.replace('-', ' ')}</span>
                      {member.lastActivity && (
                        <span className="text-xs text-gray-500">Last active: {member.lastActivity}</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button 
                    onClick={() => handleToggleMemberStatus(member.id)}
                    className={`inline-flex items-center px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                      member.status === 'paused'
                        ? 'bg-green-100 text-green-700 hover:bg-green-200'
                        : 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                    }`}
                  >
                    {member.status === 'paused' ? (
                      <>
                        <Play className="w-3 h-3 mr-1" />
                        Resume Access
                      </>
                    ) : (
                      <>
                        <Pause className="w-3 h-3 mr-1" />
                        Pause Access
                      </>
                    )}
                  </button>
                </div>
              </li>
            ))}
          </ul>

          {/* Information about pausing vs removing */}
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <div className="flex items-start">
              <AlertTriangle className="w-4 h-4 text-blue-600 mt-0.5 mr-2 flex-shrink-0" />
              <div className="text-sm text-blue-800">
                <p className="font-medium">Why pause instead of remove?</p>
                <p className="text-xs mt-1">
                  Pausing preserves project evaluation history and maintains data integrity. 
                  Paused members cannot make changes but their past contributions remain tracked.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
        
        <CardFooter className="bg-gray-50 border-t border-gray-200">
          <div className="w-full">
            <div className="flex items-center space-x-2 mb-3">
              <input
                type="email"
                placeholder="Team member's email to invite"
                value={newMemberEmail}
                onChange={(e) => setNewMemberEmail(e.target.value)}
                className="flex-grow px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 text-gray-800 focus:ring-green-500"
              />
              <select
                value={newMemberRole}
                onChange={(e) => setNewMemberRole(e.target.value as VendorTeamMember['role'])}
                className="px-3 py-2 border text-gray-800 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="developer">Developer</option>
                <option value="qa-specialist">QA Specialist</option>
                <option value="project-manager">Project Manager</option>
                <option value="team-lead">Team Lead</option>
              </select>
              <button
                onClick={handleInviteMember}
                className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
              >
                <UserPlus className="w-4 h-4 mr-1" />
                Send Invite
              </button>
            </div>
            <p className="text-xs text-gray-600">
              Invited members will receive an email with access instructions and role permissions.
            </p>
          </div>
        </CardFooter>
      </Card>
    </div>
  );

  const renderNotificationSettings = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader title="Notification Preferences" />
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-3">
              <label className="flex items-center justify-between">
                <div className="flex items-center">
                  <Mail className="w-4 h-4 text-gray-400 mr-2" />
                  <span className="text-sm text-gray-700">Email notifications</span>
                </div>
                <input
                  type="checkbox"
                  checked={settings.notifications.emailNotifications}
                  onChange={(e) => handleSettingChange('notifications', 'emailNotifications', e.target.checked)}
                  className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                />
              </label>

              <label className="flex items-center justify-between">
                <div className="flex items-center">
                  <Users className="w-4 h-4 text-gray-400 mr-2" />
                  <span className="text-sm text-gray-700">Project updates from clients</span>
                </div>
                <input
                  type="checkbox"
                  checked={settings.notifications.projectUpdates}
                  onChange={(e) => handleSettingChange('notifications', 'projectUpdates', e.target.checked)}
                  className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                />
              </label>

              <label className="flex items-center justify-between">
                <div className="flex items-center">
                  <Bell className="w-4 h-4 text-gray-400 mr-2" />
                  <span className="text-sm text-gray-700">Task assignments</span>
                </div>
                <input
                  type="checkbox"
                  checked={settings.notifications.taskAssignments}
                  onChange={(e) => handleSettingChange('notifications', 'taskAssignments', e.target.checked)}
                  className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                />
              </label>

              <label className="flex items-center justify-between">
                <div className="flex items-center">
                  <Database className="w-4 h-4 text-gray-400 mr-2" />
                  <span className="text-sm text-gray-700">Client feedback</span>
                </div>
                <input
                  type="checkbox"
                  checked={settings.notifications.clientFeedback}
                  onChange={(e) => handleSettingChange('notifications', 'clientFeedback', e.target.checked)}
                  className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                />
              </label>

              <label className="flex items-center justify-between">
                <div className="flex items-center">
                  <Users className="w-4 h-4 text-gray-400 mr-2" />
                  <span className="text-sm text-gray-700">Team activity updates</span>
                </div>
                <input
                  type="checkbox"
                  checked={settings.notifications.teamActivity}
                  onChange={(e) => handleSettingChange('notifications', 'teamActivity', e.target.checked)}
                  className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                />
              </label>

              <label className="flex items-center justify-between">
                <div className="flex items-center">
                  <AlertTriangle className="w-4 h-4 text-gray-400 mr-2" />
                  <span className="text-sm text-gray-700">Deadline reminders</span>
                </div>
                <input
                  type="checkbox"
                  checked={settings.notifications.deadlineReminders}
                  onChange={(e) => handleSettingChange('notifications', 'deadlineReminders', e.target.checked)}
                  className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                />
              </label>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderPrivacySettings = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader title="Privacy & Access Control" />
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Data Retention Period
              </label>
              <select
                value={settings.privacy.dataRetention}
                onChange={(e) => handleSettingChange('privacy', 'dataRetention', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 text-gray-800 focus:ring-green-500"
              >
                <option value="1-year">1 year</option>
                <option value="2-years">2 years</option>
                <option value="3-years">3 years</option>
                <option value="5-years">5 years</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Client Visibility Level
              </label>
              <select
                value={settings.privacy.clientVisibility}
                onChange={(e) => handleSettingChange('privacy', 'clientVisibility', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 text-gray-800 focus:ring-green-500"
              >
                <option value="limited">Limited (Project-specific only)</option>
                <option value="standard">Standard (Team performance metrics)</option>
                <option value="full">Full (Complete analytics access)</option>
              </select>
            </div>

            <div className="space-y-3">
              <label className="flex items-center justify-between">
                <div className="flex items-center">
                  <Database className="w-4 h-4 text-gray-400 mr-2" />
                  <span className="text-sm text-gray-700">Share performance analytics with clients</span>
                </div>
                <input
                  type="checkbox"
                  checked={settings.privacy.shareAnalytics}
                  onChange={(e) => handleSettingChange('privacy', 'shareAnalytics', e.target.checked)}
                  className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                />
              </label>

              <label className="flex items-center justify-between">
                <div className="flex items-center">
                  <Lock className="w-4 h-4 text-gray-400 mr-2" />
                  <span className="text-sm text-gray-700">Restrict team access to sensitive data</span>
                </div>
                <input
                  type="checkbox"
                  checked={settings.privacy.teamDataAccess === 'restricted'}
                  onChange={(e) => handleSettingChange('privacy', 'teamDataAccess', e.target.checked ? 'restricted' : 'open')}
                  className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                />
              </label>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderContent = () => {
    switch (activeSection) {
      case 'general': return renderGeneralSettings();
      case 'team': return renderTeamSettings();
      case 'notifications': return renderNotificationSettings();
      case 'privacy': return renderPrivacySettings();
      default: return renderTeamSettings();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Vendor Settings</h1>
          <p className="text-slate-600 mt-1 text-sm">
            Manage your vendor profile, team, and project collaboration preferences
          </p>
        </div>

        <div className="flex gap-8">
          {/* Sidebar Navigation */}
          <div className="w-64 flex-shrink-0">
            <nav className="space-y-1">
              {settingSections.map(section => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    activeSection === section.id
                      ? 'bg-green-100 text-green-700 border-r-2 border-green-500'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <section.icon className="w-5 h-5 mr-3" />
                  {section.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {renderContent()}
            
            {/* Save Button */}
            <div className="mt-8 flex justify-end">
              <button
                onClick={handleSave}
                className="inline-flex items-center px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
              >
                <Save className="w-4 h-4 mr-2" />
                Save Settings
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

// Protect this page - only vendors can access
export default withAuth(VendorSettingsPage, ['vendors']);