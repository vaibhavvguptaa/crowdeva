'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/Ui/card'; 
import { 
  Save, 
  Settings,
  Users,
  Shield,
  Bell,
  Palette,
  Database,
  Globe,
  Lock,
  Eye,
  Mail,
  Smartphone,
  Loader2
} from 'lucide-react';

// Type definitions for better TypeScript support
interface TeamMember {
  id: number;
  name: string;
  email: string;
  role: string;
  status: string;
  isActive: boolean;
  joinedAt: string;
  lastActive: string;
  deactivatedAt?: string;
  reactivatedAt?: string;
  profileId?: string;
  profileType?: 'developer' | 'vendor';
}

interface VendorApplication {
  id: number;
  companyName: string;
  contactEmail: string;
  contactName: string;
  status: string;
  submittedAt: string;
  currentStep: string;
  isActive: boolean;
  documents: {
    businessLicense: string;
    taxCertificate: string;
    capabilityPortfolio: string;
  };
  approvedAt?: string;
  rejectedAt?: string;
  deactivatedAt?: string;
  profileId?: string;
}

interface SettingsData {
  general: {
    projectName: string;
    description: string;
    autoSave: boolean;
    taskTimeout: number;
  };
  notifications: {
    emailNotifications: boolean;
    pushNotifications: boolean;
    taskAssignments: boolean;
    issueAlerts: boolean;
    weeklyReports: boolean;
    systemUpdates: boolean;
  };
  privacy: {
    dataRetention: string;
    anonymizeData: boolean;
    shareAnalytics: boolean;
    publicProfile: boolean;
  };
  team: {
    maxAnnotators: number;
    requireApproval: boolean;
    allowGuestAccess: boolean;
    defaultRole: string;
    enableSubAdmins: boolean;
    subAdminPermissions: {
      manageTeam: boolean;
      viewAnalytics: boolean;
      exportData: boolean;
      manageSettings: boolean;
    };
  };
  vendor: {
    enableVendorOnboarding: boolean;
    requireDocumentVerification: boolean;
    autoApproveVerified: boolean;
    onboardingSteps: string[];
  };
}

interface SettingsTabProps {
  projectId?: string;
}

export default function SettingsTab({ projectId }: SettingsTabProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [activeSection, setActiveSection] = useState('general');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Settings state
  const [settings, setSettings] = useState<SettingsData>({
    general: {
      projectName: 'Math LLM Evaluation',
      description: 'Performing specialized RLHF',
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
  });

  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([
    { 
      id: 1, 
      name: 'Alice Johnson', 
      email: 'alice@example.com', 
      role: 'Manager', 
      status: 'active', 
      isActive: true, 
      joinedAt: '2024-01-15', 
      lastActive: '2024-08-22',
      profileId: 'dev-1',
      profileType: 'developer'
    },
    { 
      id: 2, 
      name: 'Bob Williams', 
      email: 'bob@example.com', 
      role: 'Annotator', 
      status: 'active', 
      isActive: true, 
      joinedAt: '2024-02-10', 
      lastActive: '2024-08-21',
      profileId: 'dev-2',
      profileType: 'developer'
    },
    { 
      id: 3, 
      name: 'Charlie Brown', 
      email: 'charlie@example.com', 
      role: 'Reviewer', 
      status: 'active', 
      isActive: true, 
      joinedAt: '2024-03-05', 
      lastActive: '2024-08-20',
      profileId: 'dev-3',
      profileType: 'developer'
    },
    { 
      id: 4, 
      name: 'Diana Prince', 
      email: 'diana@example.com', 
      role: 'Sub-Admin', 
      status: 'active', 
      isActive: true, 
      joinedAt: '2024-01-20', 
      lastActive: '2024-08-23',
      profileId: 'vendor-1',
      profileType: 'vendor'
    },
  ]);

  const [vendorApplications, setVendorApplications] = useState<VendorApplication[]>([
    {
      id: 1,
      companyName: 'AI Solutions Inc',
      contactEmail: 'contact@aisolutions.com',
      contactName: 'John Smith',
      status: 'pending_review',
      submittedAt: '2024-08-20',
      currentStep: 'document_upload',
      isActive: true,
      documents: {
        businessLicense: 'uploaded',
        taxCertificate: 'uploaded',
        capabilityPortfolio: 'pending'
      },
      profileId: 'vendor-2'
    },
    {
      id: 2,
      companyName: 'DataTech Ventures',
      contactEmail: 'hello@datatech.com',
      contactName: 'Sarah Connor',
      status: 'approved',
      submittedAt: '2024-08-15',
      approvedAt: '2024-08-18',
      currentStep: 'final_approval',
      isActive: true,
      documents: {
        businessLicense: 'verified',
        taxCertificate: 'verified',
        capabilityPortfolio: 'verified'
      },
      profileId: 'vendor-1'
    }
  ]);

  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberRole, setNewMemberRole] = useState('annotator');

  // Fetch settings data when projectId is available
  useEffect(() => {
    if (projectId) {
      fetchSettingsData();
      fetchTeamMembers();
    }
  }, [projectId]);

  const fetchSettingsData = async () => {
    if (!projectId) {
      console.error('Project ID is missing');
      return;
    }
    
    setIsLoading(true);
    try {
      console.log('Fetching settings for project:', projectId);
      const response = await fetch(`/api/dashboard/${projectId}/settings`);
      console.log('Settings API response:', response.status, response.statusText);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Settings data received:', data);
        setSettings(data);
      } else {
        // Log more detailed error information
        console.error('Failed to fetch settings data:', {
          status: response.status,
          statusText: response.statusText,
          url: `/api/dashboard/${projectId}/settings`
        });
        // Try to get error details from response body
        try {
          const errorData = await response.json();
          console.error('Error details:', errorData);
        } catch (e) {
          console.error('Could not parse error response');
        }
      }
    } catch (error) {
      console.error('Network error fetching settings data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTeamMembers = async () => {
    if (!projectId) return;
    
    try {
      const response = await fetch(`/api/dashboard/${projectId}/team-members`);
      if (response.ok) {
        const data = await response.json();
        // Transform the data to match our TeamMember interface
        const transformedMembers: TeamMember[] = data.map((member: any) => ({
          id: Date.now() + Math.random(), // Generate a temporary ID since the backend doesn't have one
          name: member.name,
          email: member.email,
          role: member.role.charAt(0).toUpperCase() + member.role.slice(1),
          status: member.isActive ? 'active' : 'inactive',
          isActive: member.isActive,
          joinedAt: member.assignedAt ? new Date(member.assignedAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          lastActive: member.assignedAt ? new Date(member.assignedAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          profileId: member.id,
          profileType: member.userType === 'developer' ? 'developer' : member.userType === 'vendor' ? 'vendor' : undefined
        }));
        setTeamMembers(transformedMembers);
      } else {
        console.error('Failed to fetch team members');
      }
    } catch (error) {
      console.error('Error fetching team members:', error);
    }
  };

  // Filter setting sections based on user role
  const settingSections = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'team', label: 'Team & Access', icon: Users },
    // Only show vendor section for non-vendor users
    ...(user?.role !== 'vendors' ? [{ id: 'vendor', label: 'Vendor Onboarding', icon: Globe }] : []),
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'privacy', label: 'Privacy & Security', icon: Shield },
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

  const handleSave = async () => {
    if (!projectId) {
      alert('Project ID is missing');
      return;
    }
    
    setIsSaving(true);
    try {
      const response = await fetch(`/api/dashboard/${projectId}/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });
      
      if (response.ok) {
        alert('Settings saved successfully!');
      } else {
        const errorData = await response.json();
        alert(`Failed to save settings: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Failed to save settings due to a network error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddMember = async () => {
    if (!projectId || !newMemberEmail) return;
    
    try {
      const response = await fetch(`/api/dashboard/${projectId}/team-members`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: newMemberEmail,
          role: newMemberRole
        }),
      });
      
      if (response.ok) {
        const newMember = await response.json();
        // Transform the data to match our TeamMember interface
        const transformedMember: TeamMember = {
          id: Date.now() + Math.random(), // Generate a temporary ID
          name: newMember.name,
          email: newMember.email,
          role: newMember.role.charAt(0).toUpperCase() + newMember.role.slice(1),
          status: newMember.isActive ? 'active' : 'inactive',
          isActive: newMember.isActive,
          joinedAt: newMember.assignedAt ? new Date(newMember.assignedAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          lastActive: newMember.assignedAt ? new Date(newMember.assignedAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          profileId: newMember.id,
          profileType: newMember.userType === 'developer' ? 'developer' : newMember.userType === 'vendor' ? 'vendor' : undefined
        };
        setTeamMembers([...teamMembers, transformedMember]);
        setNewMemberEmail('');
        setNewMemberRole('annotator');
      } else {
        const errorData = await response.json();
        console.error('Failed to add team member:', errorData.error);
      }
    } catch (error) {
      console.error('Error adding team member:', error);
    }
  };

  const handleRemoveMember = async (id: number) => {
    const member = teamMembers.find(m => m.id === id);
    if (!projectId || !member || !member.profileId) return;
    
    try {
      const response = await fetch(`/api/dashboard/${projectId}/team-members/${member.profileId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        setTeamMembers(teamMembers.map(member => 
          member.id === id 
            ? { ...member, isActive: false, status: 'inactive', deactivatedAt: new Date().toISOString().split('T')[0] }
            : member
        ));
      } else {
        const errorData = await response.json();
        console.error('Failed to remove team member:', errorData.error);
      }
    } catch (error) {
      console.error('Error removing team member:', error);
    }
  };

  const handleReactivateMember = async (id: number) => {
    const member = teamMembers.find(m => m.id === id);
    if (!projectId || !member || !member.profileId) return;
    
    try {
      const response = await fetch(`/api/dashboard/${projectId}/team-members/${member.profileId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isActive: true
        }),
      });
      
      if (response.ok) {
        setTeamMembers(teamMembers.map(member => 
          member.id === id 
            ? { ...member, isActive: true, status: 'active', reactivatedAt: new Date().toISOString().split('T')[0] }
            : member
        ));
      } else {
        const errorData = await response.json();
        console.error('Failed to reactivate team member:', errorData.error);
      }
    } catch (error) {
      console.error('Error reactivating team member:', error);
    }
  };

  const handleVendorAction = (id: number, action: 'approve' | 'reject' | 'deactivate' | 'reactivate') => {
    setVendorApplications(vendorApplications.map(vendor => {
      if (vendor.id === id) {
        const now = new Date().toISOString().split('T')[0];
        switch (action) {
          case 'approve':
            return { ...vendor, status: 'approved', approvedAt: now, currentStep: 'final_approval' };
          case 'reject':
            return { ...vendor, status: 'rejected', rejectedAt: now };
          case 'deactivate':
            return { ...vendor, isActive: false, status: 'inactive', deactivatedAt: now };
          case 'reactivate':
            return { ...vendor, isActive: true, status: 'approved', deactivatedAt: undefined };
          default:
            return vendor;
        }
      }
      return vendor;
    }));
  };

  const handleViewMemberProfile = (profileId: string, profileType: 'developer' | 'vendor') => {
    try {
      const url = `/marketplace/profile/${profileId}?type=${profileType}&from=settings`;
      router.push(url);
    } catch (error) {
      console.error('Error navigating to profile:', error);
    }
  };

  const handleViewVendorProfile = (profileId: string) => {
    try {
      const url = `/marketplace/profile/${profileId}?type=vendor&from=settings`;
      router.push(url);
    } catch (error) {
      console.error('Error navigating to vendor profile:', error);
    }
  };

  const renderGeneralSettings = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader title="Project Information" />
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2  ">
              Project Name
            </label>
            <input
              type="text"
              value={settings.general.projectName}
              onChange={(e) => handleSettingChange('general', 'projectName', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 text-gray-800 focus:ring-green-500  "
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={settings.general.description}
              onChange={(e) => handleSettingChange('general', 'description', e.target.value)}
              rows={3}
              className="w-full px-3 text-gray-800 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
     
          </div>
        </div>
      </Card>

      <Card>
        <CardHeader title="Task Settings" />
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Task Timeout (minutes)
            </label>
            <input
              type="number"
              value={settings.general.taskTimeout}
              onChange={(e) => handleSettingChange('general', 'taskTimeout', parseInt(e.target.value))}
              min="5"
              max="120"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <p className="text-sm text-gray-500 mt-1">
              Maximum time allowed per task before auto-save
            </p>
          </div>

          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={settings.general.autoSave}
                onChange={(e) => handleSettingChange('general', 'autoSave', e.target.checked)}
                className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
              />
              <span className="ml-2 text-sm text-gray-700">Enable auto-save</span>
            </label>
            <p className="text-sm text-gray-500 mt-1 ml-6">
              Automatically save progress every 2 minutes
            </p>
          </div>
        </div>
      </Card>
    </div>
  );

  const renderTeamSettings = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader title="Team Management" />
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Maximum Annotators
              </label>
              <input
                type="number"
                value={settings.team.maxAnnotators}
                onChange={(e) => handleSettingChange('team', 'maxAnnotators', parseInt(e.target.value))}
                min="1"
                max="50"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none  text-gray-800 focus:ring-2 focus:ring-green-500"
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
                <option value="annotator">Annotator</option>
                <option value="reviewer">Reviewer</option>
                <option value="sub-admin">Sub-Admin</option>
                <option value="manager">Manager</option>
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
                <span className="ml-2 text-sm text-gray-700">Require approval for new members</span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.team.allowGuestAccess}
                  onChange={(e) => handleSettingChange('team', 'allowGuestAccess', e.target.checked)}
                  className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                />
                <span className="ml-2 text-sm text-gray-700">Allow guest access</span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.team.enableSubAdmins}
                  onChange={(e) => handleSettingChange('team', 'enableSubAdmins', e.target.checked)}
                  className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                />
                <span className="ml-2 text-sm text-gray-700">Enable sub-admin roles</span>
              </label>
            </div>

            {/* Sub-Admin Permissions */}
            {settings.team.enableSubAdmins && (
              <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="text-sm font-medium text-gray-800 mb-3">Sub-Admin Permissions</h4>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={settings.team.subAdminPermissions.manageTeam}
                      onChange={(e) => handleSettingChange('team', 'subAdminPermissions', {
                        ...settings.team.subAdminPermissions,
                        manageTeam: e.target.checked
                      })}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Manage team members</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={settings.team.subAdminPermissions.viewAnalytics}
                      onChange={(e) => handleSettingChange('team', 'subAdminPermissions', {
                        ...settings.team.subAdminPermissions,
                        viewAnalytics: e.target.checked
                      })}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">View analytics and reports</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={settings.team.subAdminPermissions.exportData}
                      onChange={(e) => handleSettingChange('team', 'subAdminPermissions', {
                        ...settings.team.subAdminPermissions,
                        exportData: e.target.checked
                      })}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Export data</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={settings.team.subAdminPermissions.manageSettings}
                      onChange={(e) => handleSettingChange('team', 'subAdminPermissions', {
                        ...settings.team.subAdminPermissions,
                        manageSettings: e.target.checked
                      })}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Manage project settings</span>
                  </label>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader title="Team Members" subtitle={`Manage who has access to this project.`} />
        <CardContent>
          {/* Member list */}
          <div className="space-y-4">
            {/* All Members */}
            <div>
              <ul className="space-y-3">
                {teamMembers.map(member => (
                  <li key={member.id} className={`flex items-center justify-between p-3 rounded-md border ${member.isActive ? 'border-gray-200 hover:bg-gray-50' : 'border-gray-200 bg-gray-50 opacity-75'}`}>
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center mr-3">
                        <span className="text-sm font-bold text-gray-600">{member.name.charAt(0)}</span>
                      </div>
                      <div>
                        <p 
                          className={`text-sm font-medium cursor-pointer hover:text-green-600 ${member.isActive ? 'text-gray-900' : 'text-gray-600'}`}
                          onClick={() => {
                            if (member.profileId) {
                              handleViewMemberProfile(member.profileId!, member.profileType || 'developer');
                            }
                          }}
                        >
                          {member.name}
                        </p>
                        <p className="text-xs text-gray-500">{member.email}</p>
                        <p className="text-xs text-gray-400">
                          Joined: {member.joinedAt}
                          {!member.isActive && member.deactivatedAt && ` • Deactivated: ${member.deactivatedAt}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          member.role === 'Manager' ? 'bg-purple-100 text-purple-700' :
                          member.role === 'Sub-Admin' ? 'bg-blue-100 text-blue-700' :
                          member.role === 'Reviewer' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-green-100 text-green-700'
                        }`}>
                          {member.role}
                        </span>
                      </div>
                      {member.profileId && (
                        <button 
                          onClick={() => {
                            console.log('View Profile button clicked for member:', member);
                            console.log('Profile ID:', member.profileId);
                            console.log('Profile Type:', member.profileType);
                            handleViewMemberProfile(member.profileId!, member.profileType || 'developer');
                          }}
                          className="text-blue-500 hover:text-blue-700 text-xs px-2 py-1 border border-blue-300 rounded hover:bg-blue-50"
                        >
                          View Profile
                        </button>
                      )}
                      {member.isActive ? (
                        <button 
                          onClick={() => handleRemoveMember(member.id)}
                          className="text-red-500 hover:text-red-700 text-xs px-2 py-1 border border-red-300 rounded hover:bg-red-50"
                        >
                          Deactivate
                        </button>
                      ) : (
                        <button 
                          onClick={() => handleReactivateMember(member.id)}
                          className="text-green-500 hover:text-green-700 text-xs px-2 py-1 border border-green-300 rounded hover:bg-green-50"
                        >
                          Reactivate
                        </button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </CardContent>
        <CardFooter className="bg-gray-50 border-t border-gray-200">
           <div className="flex items-center space-x-2">
            <input
              type="email"
              placeholder="Member's email to invite"
              value={newMemberEmail}
              onChange={(e) => setNewMemberEmail(e.target.value)}
              className="flex-grow px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 text-gray-800 focus:ring-green-500"
            />
            <select
              value={newMemberRole}
              onChange={(e) => setNewMemberRole(e.target.value)}
              className="px-3 py-2 border text-gray-800 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="annotator">Annotator</option>
              <option value="reviewer">Reviewer</option>
              <option value="sub-admin">Sub-Admin</option>
              <option value="manager">Manager</option>
            </select>
            <button
              onClick={handleAddMember}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
            >
              Send Invite
            </button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );

  const renderNotificationSettings = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader title="Notification Preferences" />
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
                <Smartphone className="w-4 h-4 text-gray-400 mr-2" />
                <span className="text-sm text-gray-700">Push notifications</span>
              </div>
              <input
                type="checkbox"
                checked={settings.notifications.pushNotifications}
                onChange={(e) => handleSettingChange('notifications', 'pushNotifications', e.target.checked)}
                className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
              />
            </label>

            <label className="flex items-center justify-between">
              <div className="flex items-center">
                <Users className="w-4 h-4 text-gray-400 mr-2" />
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
                <Bell className="w-4 h-4 text-gray-400 mr-2" />
                <span className="text-sm text-gray-700">Issue alerts</span>
              </div>
              <input
                type="checkbox"
                checked={settings.notifications.issueAlerts}
                onChange={(e) => handleSettingChange('notifications', 'issueAlerts', e.target.checked)}
                className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
              />
            </label>

            <label className="flex items-center justify-between">
              <div className="flex items-center">
                <Database className="w-4 h-4 text-gray-400 mr-2" />
                <span className="text-sm text-gray-700">Weekly reports</span>
              </div>
              <input
                type="checkbox"
                checked={settings.notifications.weeklyReports}
                onChange={(e) => handleSettingChange('notifications', 'weeklyReports', e.target.checked)}
                className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
              />
            </label>

            <label className="flex items-center justify-between">
            </label>
          </div>
        </div>
      </Card>
    </div>
  );

  const renderPrivacySettings = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader title="Privacy & Security" />
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Data Retention Period
            </label>
            <select
              value={settings.privacy.dataRetention}
              onChange={(e) => handleSettingChange('privacy', 'dataRetention', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="6-months">6 months</option>
              <option value="1-year">1 year</option>
              <option value="2-years">2 years</option>
              <option value="5-years">5 years</option>
              <option value="indefinite">Indefinite</option>
            </select>
          </div>

          <div className="space-y-3">
            <label className="flex items-center justify-between">
              <div className="flex items-center">
                <Lock className="w-4 h-4 text-gray-400 mr-2" />
                <span className="text-sm text-gray-700">Anonymize personal data in exports</span>
              </div>
              <input
                type="checkbox"
                checked={settings.privacy.anonymizeData}
                onChange={(e) => handleSettingChange('privacy', 'anonymizeData', e.target.checked)}
                className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
              />
            </label>

            <label className="flex items-center justify-between">
              <div className="flex items-center">
                <Database className="w-4 h-4 text-gray-400 mr-2" />
                <span className="text-sm text-gray-700">Share usage analytics</span>
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
                <Eye className="w-4 h-4 text-gray-400 mr-2" />
                <span className="text-sm text-gray-700">Public project profile</span>
              </div>
              <input
                type="checkbox"
                checked={settings.privacy.publicProfile}
                onChange={(e) => handleSettingChange('privacy', 'publicProfile', e.target.checked)}
                className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
              />
            </label>
          </div>
        </div>
      </Card>
    </div>
  );

  const renderVendorSettings = () => (
    <div className="space-y-6">
      {/* Vendor Onboarding Configuration */}
      <Card>
        <CardHeader title="Vendor Onboarding Configuration" />
        <CardContent>
          <div className="space-y-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={settings.vendor.enableVendorOnboarding}
                onChange={(e) => handleSettingChange('vendor', 'enableVendorOnboarding', e.target.checked)}
                className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
              />
              <span className="ml-2 text-sm text-gray-700">Enable vendor onboarding workflow</span>
            </label>

            {settings.vendor.enableVendorOnboarding && (
              <div className="space-y-4 ml-6 p-4 bg-green-50 rounded-lg border border-green-200">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={settings.vendor.requireDocumentVerification}
                    onChange={(e) => handleSettingChange('vendor', 'requireDocumentVerification', e.target.checked)}
                    className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Require document verification</span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={settings.vendor.autoApproveVerified}
                    onChange={(e) => handleSettingChange('vendor', 'autoApproveVerified', e.target.checked)}
                    className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Auto-approve verified vendors</span>
                </label>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Required Onboarding Steps
                  </label>
                  <div className="text-xs text-gray-500 space-y-1">
                    {settings.vendor.onboardingSteps.map((step, index) => (
                      <div key={step} className="flex items-center">
                        <span className="inline-flex items-center justify-center w-6 h-6 bg-green-100 text-green-600 rounded-full text-xs mr-2">
                          {index + 1}
                        </span>
                        <span className="capitalize">{step.replace('_', ' ')}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Vendor Applications Management */}
      <Card>
        <CardHeader 
          title="Vendor Applications" 
          subtitle="Manage vendor onboarding applications and approvals"
        />
        <CardContent>
          <div className="space-y-4">
            {/* Active Applications */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3">Pending Applications</h4>
              {vendorApplications.filter(vendor => vendor.isActive && vendor.status !== 'approved').length === 0 ? (
                <p className="text-sm text-gray-500 italic">No pending applications</p>
              ) : (
                <div className="space-y-3">
                  {vendorApplications
                    .filter(vendor => vendor.isActive && vendor.status !== 'approved')
                    .map(vendor => (
                      <div key={vendor.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <h5 
                              className="text-sm font-medium text-gray-900 cursor-pointer hover:text-green-600"
                              onClick={() => {
                                if (vendor.profileId) {
                                  handleViewVendorProfile(vendor.profileId!);
                                }
                              }}
                            >
                              {vendor.companyName}
                            </h5>
                            <p className="text-xs text-gray-500">{vendor.contactName} • {vendor.contactEmail}</p>
                          </div>
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                            vendor.status === 'pending_review' ? 'bg-yellow-100 text-yellow-700' :
                            vendor.status === 'rejected' ? 'bg-red-100 text-red-700' :
                            'bg-blue-100 text-blue-700'
                          }`}>
                            {vendor.status.replace('_', ' ').toUpperCase()}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500 mb-3">
                          <p>Submitted: {vendor.submittedAt}</p>
                          <p>Current Step: <span className="capitalize">{vendor.currentStep.replace('_', ' ')}</span></p>
                        </div>
                        <div className="mb-3">
                          <p className="text-xs font-medium text-gray-700 mb-1">Document Status:</p>
                          <div className="grid grid-cols-3 gap-2 text-xs">
                            {Object.entries(vendor.documents).map(([doc, status]) => (
                              <div key={doc} className="flex items-center">
                                <span className={`w-2 h-2 rounded-full mr-1 ${
                                  status === 'verified' ? 'bg-green-500' :
                                  status === 'uploaded' ? 'bg-yellow-500' :
                                  'bg-gray-300'
                                }`}></span>
                                <span className="capitalize">{doc.replace(/([A-Z])/g, ' $1').trim()}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleVendorAction(vendor.id, 'approve')}
                            className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleVendorAction(vendor.id, 'reject')}
                            className="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700"
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    ))
                  }
                </div>
              )}
            </div>

            {/* Approved Vendors */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3">Approved Vendors</h4>
              {vendorApplications.filter(vendor => vendor.isActive && vendor.status === 'approved').length === 0 ? (
                <p className="text-sm text-gray-500 italic">No approved vendors</p>
              ) : (
                <div className="space-y-2">
                  {vendorApplications
                    .filter(vendor => vendor.isActive && vendor.status === 'approved')
                    .map(vendor => (
                      <div key={vendor.id} className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                        <div>
                          <h5 
                            className="text-sm font-medium text-gray-900 cursor-pointer hover:text-green-600"
                            onClick={() => {
                              if (vendor.profileId) {
                                handleViewVendorProfile(vendor.profileId!);
                              }
                            }}
                          >
                            {vendor.companyName}
                          </h5>
                          <p className="text-xs text-gray-500">{vendor.contactName} • Approved: {vendor.approvedAt}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700">
                            ACTIVE
                          </span>
                          {vendor.profileId && (
                            <button
                              onClick={() => {
                                console.log('View Profile button clicked for vendor:', vendor);
                                console.log('Profile ID:', vendor.profileId);
                                handleViewVendorProfile(vendor.profileId!);
                              }}
                              className="text-blue-500 hover:text-blue-700 text-xs px-2 py-1 border border-blue-300 rounded hover:bg-blue-50"
                            >
                              View Profile
                            </button>
                          )}
                          <button
                            onClick={() => handleVendorAction(vendor.id, 'deactivate')}
                            className="text-red-500 hover:text-red-700 text-xs px-2 py-1 border border-red-300 rounded hover:bg-red-50"
                          >
                            Deactivate
                          </button>
                        </div>
                      </div>
                    ))
                  }
                </div>
              )}
            </div>

            {/* Inactive/Rejected Vendors */}
            {vendorApplications.some(vendor => !vendor.isActive || vendor.status === 'rejected') && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">Inactive/Rejected Vendors</h4>
                <div className="space-y-2">
                  {vendorApplications
                    .filter(vendor => !vendor.isActive || vendor.status === 'rejected')
                    .map(vendor => (
                      <div key={vendor.id} className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg opacity-75">
                        <div>
                          <h5 
                            className="text-sm font-medium text-gray-600 cursor-pointer hover:text-green-600"
                            onClick={() => {
                              if (vendor.profileId) {
                                handleViewVendorProfile(vendor.profileId!);
                              }
                            }}
                          >
                            {vendor.companyName}
                          </h5>
                          <p className="text-xs text-gray-400">
                            {vendor.contactName} • 
                            {vendor.status === 'rejected' ? `Rejected: ${vendor.rejectedAt || 'Unknown'}` : `Deactivated: ${vendor.deactivatedAt || 'Unknown'}`}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                            vendor.status === 'rejected' ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-500'
                          }`}>
                            {vendor.status === 'rejected' ? 'REJECTED' : 'INACTIVE'}
                          </span>
                          {vendor.profileId && (
                            <button
                              onClick={() => handleViewVendorProfile(vendor.profileId!)}
                              className="text-blue-500 hover:text-blue-700 text-xs px-2 py-1 border border-blue-300 rounded hover:bg-blue-50"
                            >
                              View Profile
                            </button>
                          )}
                          {vendor.status !== 'rejected' && (
                            <button
                              onClick={() => handleVendorAction(vendor.id, 'reactivate')}
                              className="text-green-500 hover:text-green-700 text-xs px-2 py-1 border border-green-300 rounded hover:bg-green-50"
                            >
                              Reactivate
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  }
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-green-600" />
        </div>
      );
    }

    // If user is a vendor and vendor section is somehow active, redirect to general
    if (user?.role === 'vendors' && activeSection === 'vendor') {
      setActiveSection('general');
      return renderGeneralSettings();
    }
    
    switch (activeSection) {
      case 'general': return renderGeneralSettings();
      case 'team': return renderTeamSettings();
      case 'vendor': return renderVendorSettings();
      case 'notifications': return renderNotificationSettings();
      case 'privacy': return renderPrivacySettings();
      default: return renderGeneralSettings();
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar Navigation */}
        <div className="lg:col-span-1">
          <Card>
            <nav className="space-y-1">
              {settingSections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    activeSection === section.id
                      ? 'bg-green-100 text-green-700'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <section.icon className="w-5 h-5 mr-3" />
                  {section.label}
                </button>
              ))}
            </nav>
          </Card>
        </div>

        {/* Settings Content */}
        <div className="lg:col-span-3">
          {renderContent()}
        </div>
      </div>
      <div className="flex justify-end items-center">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center space-x-2 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Saving...</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>Save Changes</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
