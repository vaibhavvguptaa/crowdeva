"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Send, 
  User, 
  Mail, 
  MessageSquare, 
  Calendar,
  DollarSign,
  FileText,
  CheckCircle
} from 'lucide-react';
import Header from '@/components/Ui/header';
import { withAuth } from '@/lib/auth';
import { marketplaceDataService as marketplaceService } from '@/lib/marketplaceData';
import { DeveloperProfile, VendorProfile, HiringRequest } from '@/types/marketplace';

const InvitePage: React.FC = () => {
  const router = useRouter();
  const [profile, setProfile] = useState<DeveloperProfile | VendorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [projectTitle, setProjectTitle] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [budget, setBudget] = useState('');
  const [timeline, setTimeline] = useState('');
  const [requiredSkills, setRequiredSkills] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const profileId = typeof window !== 'undefined' ? window.location.pathname.split('/').pop() : '';

  useEffect(() => {
    const fetchProfile = async () => {
      if (!profileId) return;
      
      try {
        setLoading(true);
        const profileData = await marketplaceService.getProfile(profileId);
        setProfile(profileData);
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [profileId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!profile || !projectTitle.trim() || !projectDescription.trim()) {
      setSubmitError('Please fill in all required fields');
      return;
    }
    
    try {
      setIsSubmitting(true);
      setSubmitError('');
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSubmitSuccess(true);
      
      // Reset form after 3 seconds
      setTimeout(() => {
        setSubmitSuccess(false);
        router.push('/projects');
      }, 3000);
    } catch (error) {
      setSubmitError('Failed to send invitation. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const timelineOptions = [
    'Less than 1 week',
    '1-2 weeks',
    '2-4 weeks',
    '1-3 months',
    '3-6 months',
    '6+ months'
  ];

  if (loading) {
    return (
      <div className="bg-gray-50 min-h-screen">
        <Header />
        <main className="max-w-4xl mx-auto px-4 py-8">
          <div className="animate-pulse space-y-8">
            <div className="h-12 bg-gray-200 rounded w-1/4"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="md:col-span-1">
                <div className="h-64 bg-gray-200 rounded-lg"></div>
              </div>
              <div className="md:col-span-2 space-y-4">
                <div className="h-8 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-full"></div>
                <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                <div className="h-32 bg-gray-200 rounded-lg"></div>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="bg-gray-50 min-h-screen">
        <Header />
        <main className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center shadow-sm">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageSquare className="w-8 h-8 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Profile Not Found</h3>
            <p className="text-gray-600 mb-6">
              The profile you're trying to invite doesn't exist or has been removed.
            </p>
            <button
              onClick={() => router.push('/marketplace')}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors shadow-sm"
            >
              Back to Marketplace
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <Header />
      
      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-600 hover:text-green-700 transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Profile
        </button>
        
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Invite {profile.name} to a Project</h1>
            <p className="text-gray-600 mt-2">
              Send a project invitation to {profile.type === 'developer' ? 'this developer' : 'this vendor'}
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Profile Info */}
            <div className="md:col-span-1">
              <div className="bg-gray-50 rounded-lg p-6">
                <div className="flex flex-col items-center text-center">
                  {profile.avatar ? (
                    <img
                      src={profile.avatar}
                      alt={profile.name}
                      className="w-24 h-24 rounded-full object-cover shadow-md mb-4"
                    />
                  ) : (
                    <div className="w-24 h-24 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center text-white font-bold text-2xl shadow-md mb-4">
                      {profile.name.charAt(0)}
                    </div>
                  )}
                  
                  <h2 className="text-xl font-semibold text-gray-900">{profile.name}</h2>
                  {profile.type === 'vendor' && (
                    <p className="text-gray-600">{profile.companyName}</p>
                  )}
                  <p className="text-gray-600 mt-1">
                    {profile.type === 'developer' 
                      ? profile.specializations[0] || 'Developer' 
                      : 'Vendor Company'}
                  </p>
                  
                  <div className="mt-4 space-y-2 w-full">
                    <div className="flex items-center justify-between text-gray-600">
                      <span className="text-sm">Hourly Rate</span>
                      <span className="font-medium">${profile.hourlyRate}/hr</span>
                    </div>
                    
                    <div className="flex items-center justify-between text-gray-600">
                      <span className="text-sm">Experience</span>
                      <span className="font-medium">{profile.experience} years</span>
                    </div>
                    
                    <div className="flex items-center justify-between text-gray-600">
                      <span className="text-sm">Rating</span>
                      <span className="font-medium">{profile.rating}/5</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Invite Form */}
            <div className="md:col-span-2">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="projectTitle" className="block text-sm font-medium text-gray-700 mb-1">
                    Project Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="projectTitle"
                    value={projectTitle}
                    onChange={(e) => setProjectTitle(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-gray-400 placeholder-gray-700"
                    placeholder="Enter project title"
                  />
                </div>
                
                <div>
                  <label htmlFor="projectDescription" className="block text-sm font-medium text-gray-700 mb-1">
                    Project Description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="projectDescription"
                    rows={4}
                    value={projectDescription}
                    onChange={(e) => setProjectDescription(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-gray-400 placeholder-gray-700"
                    placeholder="Describe your project in detail..."
                  ></textarea>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="budget" className="block text-sm font-medium text-gray-700 mb-1">
                      Estimated Budget (USD)
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <DollarSign className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="number"
                        id="budget"
                        value={budget}
                        onChange={(e) => setBudget(e.target.value)}
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-gray-400 placeholder-gray-700"
                        placeholder="0"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="timeline" className="block text-sm font-medium text-gray-700 mb-1">
                      Timeline
                    </label>
                    <select
                      id="timeline"
                      value={timeline}
                      onChange={(e) => setTimeline(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-gray-400"
                    >
                      <option value="">Select timeline</option>
                      {timelineOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <div>
                  <label htmlFor="requiredSkills" className="block text-sm font-medium text-gray-700 mb-1">
                    Required Skills
                  </label>
                  <input
                    type="text"
                    id="requiredSkills"
                    value={requiredSkills}
                    onChange={(e) => setRequiredSkills(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-gray-400 placeholder-gray-700"
                    placeholder="e.g., React, Node.js, Python"
                  />
                </div>
                
                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                    Additional Message
                  </label>
                  <textarea
                    id="message"
                    rows={3}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-gray-400 text-gray-600"
                    placeholder="Any additional information you'd like to share..."
                  ></textarea>
                </div>
                
                {submitError && (
                  <div className="text-red-600 text-sm">{submitError}</div>
                )}
                
                {submitSuccess && (
                  <div className="bg-green-50 text-green-700 p-4 rounded-lg flex items-center gap-2">
                    <CheckCircle className="w-5 h-5" />
                    <span>Invitation sent successfully! {profile.name} will review your project and get back to you soon.</span>
                  </div>
                )}
                
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => router.back()}
                    className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || !projectTitle.trim() || !projectDescription.trim()}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Sending Invitation...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Send Invitation
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

// Protect this page - only authenticated users can access
export default withAuth(InvitePage, ['customers', 'developers', 'vendors']);