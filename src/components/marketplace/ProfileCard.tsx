"use client";

import React, { JSX, useState } from 'react';
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
  UserPlus
} from 'lucide-react';
import { DeveloperProfile, VendorProfile } from '@/types/marketplace';
import Link from 'next/link';

interface ProfileCardProps {
  profile: DeveloperProfile | VendorProfile;
  onViewProfile: (id: string) => void;
  onContact: (id: string) => void;
  onSaveProfile?: (id: string) => void;
  onInviteToProject?: (id: string) => void;
  className?: string;
}

export const ProfileCard: React.FC<ProfileCardProps> = ({
  profile,
  onViewProfile,
  onContact,
  onSaveProfile,
  onInviteToProject,
  className = ""
}) => {
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = () => {
    setIsSaved(!isSaved);
    if (onSaveProfile) {
      onSaveProfile(profile.id);
    }
  };

  const getEarningsRange = () => {
    // Removed earnings display as per project specifications
    return "";
  };

  const renderStarRating = () => {
    const fullStars = Math.floor(profile.rating);
    const hasHalfStar = profile.rating % 1 !== 0;
    
    return (
      <div className="flex items-center gap-1">
        <div className="flex items-center">
          {[...Array(5)].map((_, index) => (
            <Star
              key={index}
              className={`w-4 h-4 ${
                index < fullStars
                  ? 'text-yellow-400 fill-current'
                  : index === fullStars && hasHalfStar
                  ? 'text-yellow-400 fill-current'
                  : 'text-gray-300'
              }`}
            />
          ))}
        </div>
        <span className="text-sm font-medium text-gray-900">{profile.rating}</span>
        <span className="text-sm text-gray-500">({profile.reviewCount} reviews)</span>
        <span className="text-sm text-green-600 font-medium ml-2">{Math.round((profile.rating / 5) * 100)}% success</span>
      </div>
    );
  };

  const renderProfilePicture = () => {
    if (profile.avatar) {
      return (
        <img
          src={profile.avatar}
          alt={profile.name}
          className="w-16 h-16 rounded-full object-cover shadow-md"
        />
      );
    }
    
    return (
      <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md">
        {profile.name.charAt(0)}
      </div>
    );
  };

  const renderBadges = () => {
    // Create a Set to track unique badges and avoid duplicates
    const uniqueBadges = new Set<string>();
    const badgeElements: JSX.Element[] = [];

    // Add verified badge if applicable
    if (profile.verified) {
      uniqueBadges.add('verified');
      badgeElements.push(
        <span key="verified" className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <CheckCircle className="w-3 h-3 mr-1" />
          Verified
        </span>
      );
    }

    // Add top rated badge if applicable
    if (profile.topRated) {
      uniqueBadges.add('top rated');
      badgeElements.push(
        <span key="top-rated" className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <Award className="w-3 h-3 mr-1" />
          Top Rated
        </span>
      );
    }

    // Add other badges from profile, avoiding duplicates
    profile.badges.forEach((badge, index) => {
      const badgeKey = badge.toLowerCase();
      
      // Skip if we already have this badge type
      if (uniqueBadges.has(badgeKey)) return;
      
      // Skip specific badges that are already handled by boolean properties
      if (badgeKey === 'verified' || badgeKey === 'top rated') return;
      
      uniqueBadges.add(badgeKey);
      
      // Only show first 2 additional badges to prevent clutter
      if (badgeElements.length < 4) {
        badgeElements.push(
          <span 
            key={`badge-${index}`}
            className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800"
          >
            {badge}
          </span>
        );
      }
    });

    // Only render if we have badges to show
    if (badgeElements.length === 0) return null;

    return (
      <div className="flex flex-wrap gap-1 mb-3">
        {badgeElements}
      </div>
    );
  };

  const renderAvailabilityStatus = () => {
    // Removed availability status display
    return null;
  };

  const renderRoleTitle = () => {
    if (profile.type === 'developer') {
      const primarySpec = profile.specializations[0] || 'Developer';
      return primarySpec;
    } else {
      return 'Vendor Company';
    }
  };

  const renderEducation = () => {
    if (profile.type !== 'developer' || !profile.education.length) return null;
    
    const latestEducation = profile.education[0];
    return (
      <div className="flex items-center gap-1 text-sm text-gray-600">
        <GraduationCap className="w-4 h-4" />
        <span>{latestEducation.degree}, {latestEducation.institution} ({latestEducation.endYear})</span>
      </div>
    );
  };

  const renderCertifications = () => {
    if (profile.type !== 'developer' || !profile.certifications.length) return null;
    
    return (
      <div className="flex items-center gap-1 text-sm text-gray-600">
        <Shield className="w-4 h-4" />
        <span>{profile.certifications.length} certification{profile.certifications.length > 1 ? 's' : ''}</span>
      </div>
    );
  };

  const renderKeySkills = () => {
    if (profile.type !== 'developer') return null;
    
    return (
      <div className="mb-4">
        <div className="flex flex-wrap gap-1">
          {profile.skills.slice(0, 6).map((skill, index) => (
            <span 
              key={index}
              className={`px-2 py-1 text-xs rounded-md ${
                skill.level === 'Expert' ? 'bg-green-100 text-green-800' :
                skill.level === 'Advanced' ? 'bg-green-50 text-green-700' :
                'bg-gray-100 text-gray-700'
              }`}
            >
              {skill.name}
            </span>
          ))}
          {profile.skills.length > 6 && (
            <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-md">
              +{profile.skills.length - 6} more
            </span>
          )}
        </div>
      </div>
    );
  };

  const renderVendorServices = () => {
    if (profile.type !== 'vendor') return null;
    
    return (
      <div className="mb-4">
        <div className="flex flex-wrap gap-1">
          {profile.services.slice(0, 3).map((service, index) => (
            <span 
              key={index}
              className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-md"
            >
              {service.category}
            </span>
          ))}
          {profile.services.length > 3 && (
            <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-md">
              +{profile.services.length - 3} more
            </span>
          )}
        </div>
      </div>
    );
  };

  const renderCompanyInfo = () => {
    if (profile.type !== 'vendor') return null;
    
    return (
      <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
        <div className="flex items-center gap-1">
          <Users className="w-4 h-4" />
          <span>{profile.companySize} employees</span>
        </div>
        <div className="flex items-center gap-1">
          <Calendar className="w-4 h-4" />
          <span>{profile.teamMembers} team members</span>
        </div>
      </div>
    );
  };

  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-all duration-200 hover:border-gray-300 relative ${className}`}>
      
      {/* Save to Shortlist Button */}
      <button
        onClick={handleSave}
        className={`absolute top-4 right-4 p-2 rounded-full transition-colors ${
          isSaved 
            ? 'text-red-500 bg-red-50 hover:bg-red-100' 
            : 'text-gray-400 hover:text-red-500 hover:bg-gray-50'
        }`}
        title="Save to shortlist"
      >
        <Heart className={`w-5 h-5 ${isSaved ? 'fill-current' : ''}`} />
      </button>

      {/* Header */}
      <div className="flex items-start gap-4 mb-4">
        {renderProfilePicture()}
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-lg font-semibold text-gray-900 truncate">
              {profile.name}
            </h3>
          </div>
          
          <p className="text-sm font-medium text-gray-600 mb-2">{renderRoleTitle()}</p>
          
          {profile.type === 'vendor' && (
            <p className="text-sm text-gray-600 mb-2">{profile.companyName}</p>
          )}
          
          <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
            <div className="flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              <span>{profile.location}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span>{profile.lastActive}</span>
            </div>
          </div>

          {/* Availability Status */}
          <div className="mb-3">
            {renderAvailabilityStatus()}
          </div>
        </div>
      </div>

      {/* Badges */}
      {renderBadges()}

      {/* Rating & Success Score */}
      <div className="mb-4">
        {renderStarRating()}
      </div>

      {/* Hourly Rate */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-1">
          <DollarSign className="w-4 h-4 text-gray-500" />
          <span className="text-lg font-semibold text-gray-900">
            ${profile.hourlyRate}/hr
          </span>
        </div>
      </div>

      {/* Experience & Details */}
      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-1 text-sm text-gray-600">
          <Clock className="w-4 h-4" />
          <span>{profile.experience} years experience</span>
        </div>
        {renderEducation()}
        {renderCertifications()}
      </div>

      {/* Company Info for Vendors */}
      {renderCompanyInfo()}

      {/* Skills/Services */}
      {renderKeySkills()}
      {renderVendorServices()}

      {/* Description */}
      <p className="text-sm text-gray-700 mb-4 line-clamp-2">
        {profile.description}
      </p>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Link
          href={`/marketplace/profile/${profile.id}?type=${profile.type}`}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <Eye className="w-4 h-4" />
          <span>View Profile</span>
        </Link>
        
        {onInviteToProject ? (
          <button
            onClick={() => onInviteToProject(profile.id)}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            <span>Invite to Project</span>
          </button>
        ) : (
          <button
            onClick={() => onContact(profile.id)}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Mail className="w-4 h-4" />
            <span>Contact</span>
          </button>
        )}
      </div>
    </div>
  );
};
