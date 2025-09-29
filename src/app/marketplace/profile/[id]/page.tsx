"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams, useParams } from 'next/navigation';
import { 
  Star, 
  MapPin, 
  Clock, 
  DollarSign, 
  CheckCircle, 
  Award, 
  Users, 
  MessageCircle,
  Eye,
  Heart,
  Calendar,
  GraduationCap,
  TrendingUp,
  Shield,
  Mail,
  UserPlus,
  ArrowLeft,
  ExternalLink,
  Building2,
  Globe,
  Github,
  Linkedin
} from 'lucide-react';
import Header from '@/components/Ui/header';
import { withAuth } from '@/lib/auth';
import { marketplaceDataService as marketplaceService } from '@/lib/marketplaceData';
import { DeveloperProfile, VendorProfile } from '@/types/marketplace';

const ProfilePage: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const params = useParams();
  const profileType = searchParams?.get('type') || 'developer';
  
  const [profile, setProfile] = useState<DeveloperProfile | VendorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaved, setIsSaved] = useState(false);
  const [referrer, setReferrer] = useState<string | null>(null);

  const profileId = Array.isArray(params?.id) ? params.id[0] : params?.id || (typeof window !== 'undefined' ? window.location.pathname.split('/').pop() : '');

  useEffect(() => {
    // Store the referrer when the component mounts
    if (typeof window !== 'undefined') {
      setReferrer(document.referrer);
    }
    
    const fetchProfile = async () => {
      if (!profileId) {
        console.log('No profile ID provided');
        return;
      }
      
      console.log('Fetching profile with ID:', profileId);
      
      try {
        setLoading(true);
        const profileData = await marketplaceService.getProfile(profileId);
        console.log('Profile data received:', profileData);
        setProfile(profileData);
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [profileId]);

  const handleSave = () => {
    setIsSaved(!isSaved);
  };

  const handleContact = () => {
    if (!profile) return;
    router.push(`/marketplace/contact/${profile.id}`);
  };

  const handleInviteToProject = () => {
    if (!profile) return;
    router.push(`/marketplace/invite/${profile.id}`);
  };

  const renderStarRating = () => {
    if (!profile) return null;
    
    const fullStars = Math.floor(profile.rating);
    const hasHalfStar = profile.rating % 1 !== 0;
    
    return (
      <div className="flex items-center gap-1">
        <div className="flex items-center">
          {[...Array(5)].map((_, index) => (
            <Star
              key={index}
              className={`w-5 h-5 ${
                index < fullStars
                  ? 'text-yellow-400 fill-current'
                  : index === fullStars && hasHalfStar
                  ? 'text-yellow-400 fill-current'
                  : 'text-gray-300'
              }`}
            />
          ))}
        </div>
        <span className="text-lg font-medium text-gray-900">{profile.rating}</span>
        <span className="text-gray-500">({profile.reviewCount} reviews)</span>
        <span className="text-green-600 font-medium ml-2">{Math.round((profile.rating / 5) * 100)}% success</span>
      </div>
    );
  };

  const renderProfilePicture = () => {
    if (!profile) return null;
    
    if (profile.avatar) {
      return (
        <img
          src={profile.avatar}
          alt={profile.name}
          className="w-32 h-32 rounded-full object-cover shadow-lg"
        />
      );
    }
    
    return (
      <div className="w-32 h-32 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center text-gray-700 font-bold text-3xl shadow-lg">
        {profile.name.charAt(0)}
      </div>
    );
  };

  const renderBadges = () => {
    if (!profile) return null;
    
    return (
      <div className="flex flex-wrap gap-2 mb-4">
        {profile.verified && (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
            <CheckCircle className="w-4 h-4 mr-1" />
            Verified
          </span>
        )}
        {profile.topRated && (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
            <Award className="w-4 h-4 mr-1" />
            Top Rated
          </span>
        )}
        {profile.badges.map((badge, index) => (
          <span 
            key={index}
            className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
          >
            {badge}
          </span>
        ))}
      </div>
    );
  };

  const renderEducation = () => {
    if (!profile || profile.type !== 'developer' || !profile.education.length) return null;
    
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Education</h3>
        {profile.education.map((edu, index) => (
          <div key={index} className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
            <div className="p-2 bg-white rounded-lg shadow-sm">
              <GraduationCap className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h4 className="font-medium text-gray-900">{edu.degree}</h4>
              <p className="text-gray-600">{edu.institution}</p>
              <p className="text-sm text-gray-500">{edu.startYear} - {edu.endYear}</p>
              {edu.description && (
                <p className="text-sm text-gray-600 mt-1">{edu.description}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderCertifications = () => {
    if (!profile || profile.type !== 'developer' || !profile.certifications.length) return null;
    
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Certifications</h3>
        {profile.certifications.map((cert, index) => (
          <div key={index} className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
            <div className="p-2 bg-white rounded-lg shadow-sm">
              <Shield className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h4 className="font-medium text-gray-900">{cert.name}</h4>
              <p className="text-gray-600">{cert.issuer}</p>
              <p className="text-sm text-gray-500">Issued: {cert.issueDate}</p>
              {cert.expiryDate && (
                <p className="text-sm text-gray-500">Expires: {cert.expiryDate}</p>
              )}
              {(cert.credentialId || cert.credentialUrl) && (
                <div className="mt-2">
                  {cert.credentialId && (
                    <p className="text-sm text-gray-600">ID: {cert.credentialId}</p>
                  )}
                  {cert.credentialUrl && (
                    <a 
                      href={cert.credentialUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm text-green-600 hover:text-green-700 flex items-center gap-1"
                    >
                      View Credential <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderPortfolio = () => {
    if (!profile || !profile.portfolio.length) return null;
    
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Portfolio</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {profile.portfolio.map((item, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              {item.imageUrl && (
                <img 
                  src={item.imageUrl} 
                  alt={item.title} 
                  className="w-full h-40 object-cover rounded-lg mb-3"
                />
              )}
              <h4 className="font-medium text-gray-900">{item.title}</h4>
              <p className="text-sm text-gray-600 mb-2">{item.description}</p>
              <div className="flex flex-wrap gap-1 mb-2">
                {item.technologies.map((tech, techIndex) => (
                  <span 
                    key={techIndex}
                    className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-md"
                  >
                    {tech}
                  </span>
                ))}
              </div>
              <p className="text-xs text-gray-500">Completed: {item.completedAt}</p>
              {item.projectUrl && (
                <a 
                  href={item.projectUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm text-green-600 hover:text-green-700 flex items-center gap-1 mt-2"
                >
                  View Project <ExternalLink className="w-3 h-3" />
                </a>
              )}
              {item.clientTestimonial && (
                <div className="mt-2 p-2 bg-green-50 rounded border-l-2 border-green-500">
                  <p className="text-sm text-gray-700 italic">"{item.clientTestimonial}"</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderDeveloperSkills = () => {
    if (!profile || profile.type !== 'developer') return null;
    
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Skills</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {profile.skills.map((skill, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4">
              <div className="flex justify-between items-center mb-2">
                <h4 className="font-medium text-gray-900">{skill.name}</h4>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  skill.level === 'Expert' ? 'bg-indigo-100 text-indigo-800' :
                  skill.level === 'Advanced' ? 'bg-blue-100 text-blue-800' :
                  skill.level === 'Intermediate' ? 'bg-green-100 text-green-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {skill.level}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm text-gray-600">
                <span>{skill.yearsOfExperience} years experience</span>
                {skill.endorsed && (
                  <span className="flex items-center gap-1 text-green-600">
                    <CheckCircle className="w-4 h-4" />
                    Endorsed
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Specializations</h3>
          <div className="flex flex-wrap gap-2">
            {profile.specializations.map((spec, index) => (
              <span 
                key={index}
                className="px-3 py-1.5 bg-green-100 text-green-800 rounded-full text-sm font-medium"
              >
                {spec}
              </span>
            ))}
          </div>
        </div>
        
        <div className="mt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Programming Languages</h3>
          <div className="flex flex-wrap gap-2">
            {profile.programmingLanguages.map((lang, index) => (
              <span 
                key={index}
                className="px-3 py-1.5 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
              >
                {lang}
              </span>
            ))}
          </div>
        </div>
        
        <div className="mt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Frameworks & Libraries</h3>
          <div className="flex flex-wrap gap-2">
            {profile.frameworks.map((framework, index) => (
              <span 
                key={index}
                className="px-3 py-1.5 bg-purple-100 text-purple-800 rounded-full text-sm font-medium"
              >
                {framework}
              </span>
            ))}
          </div>
        </div>
        
        <div className="mt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">API Experience</h3>
          <div className="flex flex-wrap gap-2">
            {profile.apiExperience.map((api, index) => (
              <span 
                key={index}
                className="px-3 py-1.5 bg-orange-100 text-orange-800 rounded-full text-sm font-medium"
              >
                {api}
              </span>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderVendorServices = () => {
    if (!profile || profile.type !== 'vendor') return null;
    
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Services</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {profile.services.map((service, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4">
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-medium text-gray-900">{service.name}</h4>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  service.category === 'Data Annotation' ? 'bg-indigo-100 text-indigo-800' :
                  service.category === 'Quality Assurance' ? 'bg-green-100 text-green-800' :
                  service.category === 'Consulting' ? 'bg-purple-100 text-purple-800' :
                  service.category === 'Custom Development' ? 'bg-blue-100 text-blue-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {service.category}
                </span>
              </div>
              <p className="text-sm text-gray-600 mb-3">{service.description}</p>
              <div className="flex justify-between items-center text-sm">
                <span className={`px-2 py-1 rounded-full ${
                  service.pricing === 'Fixed' ? 'bg-yellow-100 text-yellow-800' :
                  service.pricing === 'Hourly' ? 'bg-blue-100 text-blue-800' :
                  'bg-green-100 text-green-800'
                }`}>
                  {service.pricing}
                </span>
                <span className="text-gray-500">Delivery: {service.deliveryTime}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderVendorCompanyInfo = () => {
    if (!profile || profile.type !== 'vendor') return null;
    
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Company Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-5 h-5 text-gray-500" />
              <h4 className="font-medium text-gray-900">Team Size</h4>
            </div>
            <p className="text-gray-600">{profile.teamMembers} team members</p>
          </div>
          
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Building2 className="w-5 h-5 text-gray-500" />
              <h4 className="font-medium text-gray-900">Company Size</h4>
            </div>
            <p className="text-gray-600">{profile.companySize} employees</p>
          </div>
          
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5 text-gray-500" />
              <h4 className="font-medium text-gray-900">Retention Rate</h4>
            </div>
            <p className="text-gray-600">{profile.clientRetentionRate}%</p>
          </div>
          
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-5 h-5 text-gray-500" />
              <h4 className="font-medium text-gray-900">Project Duration</h4>
            </div>
            <p className="text-gray-600">{profile.averageProjectDuration}</p>
          </div>
        </div>
        
        <div className="mt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Industries</h3>
          <div className="flex flex-wrap gap-2">
            {profile.industries.map((industry, index) => (
              <span 
                key={index}
                className="px-3 py-1.5 bg-green-100 text-green-800 rounded-full text-sm font-medium"
              >
                {industry}
              </span>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderSocialLinks = () => {
    if (!profile || profile.type !== 'developer') return null;
    
    return (
      <div className="flex gap-3">
        {profile.githubUrl && (
          <a 
            href={profile.githubUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="p-2 bg-gray-100 rounded-full text-gray-700 hover:bg-gray-200 transition-colors"
            title="GitHub"
          >
            <Github className="w-5 h-5" />
          </a>
        )}
        {profile.linkedinUrl && (
          <a 
            href={profile.linkedinUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="p-2 bg-blue-100 rounded-full text-blue-700 hover:bg-blue-200 transition-colors"
            title="LinkedIn"
          >
            <Linkedin className="w-5 h-5" />
          </a>
        )}
        {profile.websiteUrl && (
          <a 
            href={profile.websiteUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="p-2 bg-green-100 rounded-full text-green-700 hover:bg-green-200 transition-colors"
            title="Website"
          >
            <Globe className="w-5 h-5" />
          </a>
        )}
      </div>
    );
  };

  const getEarningsRange = () => {
    // Removed earnings display as per project specifications
    return "";
  };

  const handleBackNavigation = () => {
    // Check if user came from settings page by looking at the referrer or checking for a specific parameter
    const cameFromSettings = referrer?.includes('/settings') || searchParams?.get('from') === 'settings';
    
    if (cameFromSettings) {
      // Go back to settings page
      router.push('/settings');
    } else {
      // Default behavior - go back in history
      router.back();
    }
  };

  if (loading) {
    return (
      <div className="bg-gray-50 min-h-screen">
        <Header />
        <main className="max-w-7xl mx-auto px-4 py-8">
          <div className="animate-pulse space-y-8">
            <div className="h-12 bg-gray-200 rounded w-1/4"></div>
            <div className="flex flex-col md:flex-row gap-8">
              <div className="w-full md:w-1/3">
                <div className="h-32 w-32 bg-gray-200 rounded-full mx-auto"></div>
                <div className="mt-4 space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
                  <div className="h-8 bg-gray-200 rounded w-full"></div>
                </div>
              </div>
              <div className="w-full md:w-2/3 space-y-4">
                <div className="h-6 bg-gray-200 rounded w-1/3"></div>
                <div className="h-4 bg-gray-200 rounded w-full"></div>
                <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                <div className="h-4 bg-gray-200 rounded w-4/6"></div>
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
        <main className="max-w-7xl mx-auto px-4 py-8">
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center shadow-sm">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageCircle className="w-8 h-8 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Profile Not Found</h3>
            <p className="text-gray-600 mb-6">
              The profile you're looking for doesn't exist or has been removed.
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
      
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Back Button */}
        <button
          onClick={handleBackNavigation}
          className="flex items-center gap-2 text-gray-600 hover:text-green-700 transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          {referrer?.includes('/settings') || searchParams?.get('from') === 'settings' ? 'Back to Settings' : 'Back to Marketplace'}
        </button>
        
        <div className="flex flex-col md:flex-row gap-8">
          {/* Profile Sidebar */}
          <div className="w-full md:w-1/3">
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm sticky top-6">
              <div className="text-center mb-6">
                {renderProfilePicture()}
                <h1 className="text-2xl font-bold text-gray-900 mt-4">{profile.name}</h1>
                {profile.type === 'vendor' && (
                  <p className="text-lg text-gray-600">{profile.companyName}</p>
                )}
                <p className="text-gray-600 mt-1">
                  {profile.type === 'developer' 
                    ? profile.specializations[0] || 'Developer' 
                    : 'Vendor Company'}
                </p>
              </div>
              
              {renderBadges()}
              
              <div className="space-y-4 mb-6">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-gray-500" />
                    <span className="text-gray-600">Location</span>
                  </div>
                  <span className="font-medium">{profile.location}</span>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-gray-500" />
                    <span className="text-gray-600">Last Active</span>
                  </div>
                  <span className="font-medium">{profile.lastActive}</span>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-gray-500" />
                    <span className="text-gray-600">Hourly Rate</span>
                  </div>
                  <span className="font-medium">${profile.hourlyRate}/hr</span>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-gray-500" />
                    <span className="text-gray-600">Experience</span>
                  </div>
                  <span className="font-medium">{profile.experience} years</span>
                </div>
              </div>
              
              {renderStarRating()}
              
              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleSave}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 border rounded-lg transition-colors ${
                    isSaved 
                      ? 'border-red-300 text-red-500 bg-red-50 hover:bg-red-100' 
                      : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Heart className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
                  <span>Save</span>
                </button>
                
                <button
                  onClick={handleContact}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Mail className="w-4 h-4" />
                  <span>Contact</span>
                </button>
              </div>
              
              <button
                onClick={handleInviteToProject}
                className="w-full mt-3 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <UserPlus className="w-4 h-4" />
                <span>Invite to Project</span>
              </button>
              
              {profile.type === 'developer' && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Connect</h3>
                  {renderSocialLinks()}
                </div>
              )}
            </div>
          </div>
          
          {/* Profile Content */}
          <div className="w-full md:w-2/3">
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">About</h2>
              <p className="text-gray-700 whitespace-pre-line">{profile.description}</p>
            </div>
            
            {profile.type === 'developer' ? (
              <>
                {renderDeveloperSkills()}
                <div className="mt-8">
                  {renderEducation()}
                </div>
                <div className="mt-8">
                  {renderCertifications()}
                </div>
              </>
            ) : (
              <>
                {renderVendorServices()}
                <div className="mt-8">
                  {renderVendorCompanyInfo()}
                </div>
              </>
            )}
            
            <div className="mt-8">
              {renderPortfolio()}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

// Protect this page - only authenticated users can access
export default withAuth(ProfilePage, ['customers', 'developers', 'vendors']);