"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Send, 
  User, 
  Mail, 
  MessageSquare, 
  Phone,
  Building2
} from 'lucide-react';
import Header from '@/components/Ui/header';
import { withAuth } from '@/lib/auth';
import { DeveloperProfile, VendorProfile } from '@/types/marketplace';

const ContactPage: React.FC = () => {
  const router = useRouter();
  const [profile, setProfile] = useState<DeveloperProfile | VendorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [subject, setSubject] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const profileId = typeof window !== 'undefined' ? window.location.pathname.split('/').pop() : '';

  useEffect(() => {
    const fetchProfile = async () => {
      if (!profileId) return;
      
      try {
        setLoading(true);
        // Use API call instead of importing service directly
        const response = await fetch(`/api/marketplace/profiles/${profileId}`);
        if (response.ok) {
          const profileData = await response.json();
          setProfile(profileData);
          
          if (profileData) {
            setSubject(`Interest in working with ${profileData.name}`);
          }
        } else {
          console.error('Failed to fetch profile:', response.status);
        }
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
    
    if (!profile || !message.trim()) {
      setSubmitError('Please enter a message');
      return;
    }
    
    try {
      setIsSubmitting(true);
      setSubmitError('');
      
      // Use API call instead of importing service directly
      const response = await fetch(`/api/marketplace/profiles/${profileId}/contact`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message, subject }),
      });
      
      if (response.ok) {
        setSubmitSuccess(true);
        setMessage('');
        
        // Reset success message after 3 seconds
        setTimeout(() => {
          setSubmitSuccess(false);
        }, 3000);
      } else {
        setSubmitError('Failed to send message. Please try again.');
      }
    } catch (error) {
      setSubmitError('Failed to send message. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

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
              The profile you're trying to contact doesn't exist or has been removed.
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
            <h1 className="text-2xl font-bold text-gray-900">Contact {profile.name}</h1>
            <p className="text-gray-600 mt-2">
              Send a message to {profile.type === 'developer' ? 'this developer' : 'this vendor'} regarding your project
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
                    <div className="flex items-center gap-2 text-gray-600">
                      <Mail className="w-4 h-4" />
                      <span className="text-sm truncate">{profile.email}</span>
                    </div>
                    
                    {profile.type === 'vendor' && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <Building2 className="w-4 h-4" />
                        <span className="text-sm">{profile.companySize} employees</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Contact Form */}
            <div className="md:col-span-2">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
                    Subject
                  </label>
                  <input
                    type="text"
                    id="subject"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="Enter subject"
                  />
                </div>
                
                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                    Message
                  </label>
                  <textarea
                    id="message"
                    rows={6}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="Hello, I'm interested in working with you on a project..."
                  ></textarea>
                </div>
                
                {submitError && (
                  <div className="text-red-600 text-sm">{submitError}</div>
                )}
                
                {submitSuccess && (
                  <div className="bg-green-50 text-green-700 p-4 rounded-lg">
                    Message sent successfully! {profile.name} will get back to you soon.
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
                    disabled={isSubmitting || !message.trim()}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Send Message
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
export default withAuth(ContactPage, ['customers', 'developers', 'vendors']);