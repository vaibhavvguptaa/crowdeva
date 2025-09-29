import React, { useState } from 'react';
import { AlertTriangle, MapPin, Shield, Clock } from 'lucide-react';
import { LocationInfo } from '@/hooks/useLocationAwareAuth';

interface LocationBlockedModalProps {
  isOpen: boolean;
  onClose: () => void;
  locationInfo: LocationInfo | null;
  supportEmail?: string;
}

export const LocationBlockedModal: React.FC<LocationBlockedModalProps> = ({
  isOpen,
  onClose,
  locationInfo,
  supportEmail = 'support@crowdeval.com'
}) => {
  if (!isOpen) return null;

  const getRiskLevelColor = (riskScore?: number) => {
    if (!riskScore) return 'text-yellow-600';
    if (riskScore >= 80) return 'text-red-600';
    if (riskScore >= 60) return 'text-orange-600';
    return 'text-yellow-600';
  };

  const getRiskLevelText = (riskScore?: number) => {
    if (!riskScore) return 'Medium';
    if (riskScore >= 80) return 'High';
    if (riskScore >= 60) return 'Medium-High';
    return 'Medium';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-xl">
        <div className="flex items-center mb-4">
          <AlertTriangle className="w-8 h-8 text-red-500 mr-3" />
          <h2 className="text-xl font-bold text-gray-900">Access Restricted</h2>
        </div>
        
        <div className="mb-6">
          <p className="text-gray-700 mb-4">
            Access to CrowdEval is not available from your current location due to security policies.
          </p>
          
          {locationInfo && (
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              {locationInfo.country && (
                <div className="flex items-center">
                  <MapPin className="w-4 h-4 text-gray-500 mr-2" />
                  <span className="text-sm text-gray-700">
                    Location: {locationInfo.city ? `${locationInfo.city}, ` : ''}{locationInfo.country}
                  </span>
                </div>
              )}
              
              {locationInfo.riskScore !== undefined && (
                <div className="flex items-center">
                  <Shield className="w-4 h-4 text-gray-500 mr-2" />
                  <span className="text-sm text-gray-700">
                    Risk Level: <span className={getRiskLevelColor(locationInfo.riskScore)}>
                      {getRiskLevelText(locationInfo.riskScore)} ({locationInfo.riskScore}/100)
                    </span>
                  </span>
                </div>
              )}
              
              {locationInfo.reason && (
                <div className="flex items-start">
                  <AlertTriangle className="w-4 h-4 text-gray-500 mr-2 mt-0.5" />
                  <span className="text-sm text-gray-700">
                    Reason: {locationInfo.reason}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
        
        <div className="mb-6">
          <h3 className="font-semibold text-gray-900 mb-2">What you can do:</h3>
          <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside">
            <li>Contact our support team if you believe this is an error</li>
            <li>Try accessing from a different network or location</li>
            <li>Ensure you're not using a VPN or proxy service</li>
          </ul>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Try Again
          </button>
          <a
            href={`mailto:${supportEmail}?subject=Location Access Issue&body=I am unable to access CrowdEval from my location. Location: ${locationInfo?.country || 'Unknown'}. Reason: ${locationInfo?.reason || 'Unknown'}.`}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-center"
          >
            Contact Support
          </a>
        </div>
      </div>
    </div>
  );
};

interface LocationStatusBadgeProps {
  locationInfo: LocationInfo | null;
  className?: string;
}

export const LocationStatusBadge: React.FC<LocationStatusBadgeProps> = ({
  locationInfo,
  className = ''
}) => {
  if (!locationInfo) return null;

  const isAllowed = locationInfo.allowed;
  const riskScore = locationInfo.riskScore || 0;

  return (
    <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${className}`}>
      {isAllowed ? (
        <>
          <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
          <span className="text-green-800">
            {locationInfo.whitelisted ? 'Whitelisted' : 'Location Verified'}
          </span>
        </>
      ) : (
        <>
          <div className="w-2 h-2 bg-red-400 rounded-full mr-2"></div>
          <span className="text-red-800">Location Blocked</span>
        </>
      )}
      
      {riskScore > 0 && (
        <span className="ml-2 text-gray-600">
          (Risk: {riskScore})
        </span>
      )}
    </div>
  );
};

interface LocationAwareAuthFormProps {
  children: React.ReactNode;
  locationInfo: LocationInfo | null;
  locationBlocked: boolean;
  onLocationError?: (error: string) => void;
}

export const LocationAwareAuthForm: React.FC<LocationAwareAuthFormProps> = ({
  children,
  locationInfo,
  locationBlocked,
  onLocationError
}) => {
  const [showLocationModal, setShowLocationModal] = useState(locationBlocked);

  React.useEffect(() => {
    setShowLocationModal(locationBlocked);
    if (locationBlocked && locationInfo?.reason && onLocationError) {
      onLocationError(locationInfo.reason);
    }
  }, [locationBlocked, locationInfo, onLocationError]);

  return (
    <>
      {children}
      <LocationBlockedModal
        isOpen={showLocationModal}
        onClose={() => setShowLocationModal(false)}
        locationInfo={locationInfo}
      />
    </>
  );
};
