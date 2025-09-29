"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Code, 
  Building2, 
  Users, 
  Zap, 
  Award, 
  TrendingUp,
  ArrowRight,
  Search,
  Star,
  CheckCircle,
  Rocket,
  Shield,
  Clock,
  Briefcase
} from 'lucide-react';
import Header from '@/components/Ui/header';
import { withAuth } from '@/lib/auth';
import { marketplaceDataService as marketplaceService } from '@/lib/marketplaceData';
import { DeveloperProfile, VendorProfile } from '@/types/marketplace';
import { ProfileCard } from '@/components/marketplace/ProfileCard';

// Simple stat card for key metrics
const StatCard = ({ icon, value, label }: { icon: React.ReactNode; value: string | number; label: string; }) => (
  <div className="bg-white border border-gray-200 rounded-lg p-4 text-center hover:shadow-sm transition-shadow">
    <div className="flex justify-center mb-2">
      <div className="p-2 bg-green-50 rounded-lg text-green-600">
        {icon}
      </div>
    </div>
    <div className="text-xl font-semibold text-gray-900">{value}</div>
    <div className="text-xs text-gray-500 uppercase tracking-wide">{label}</div>
  </div>
);

// Category card for developer/vendor navigation
const CategoryCard = ({ title, description, icon, count, onClick }: { 
  title: string; 
  description: string; 
  icon: React.ReactNode;
  count: number;
  onClick: () => void; 
}) => (
  <div 
    className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-sm transition-all cursor-pointer group"
    onClick={onClick}
  >
    <div className="flex items-start justify-between mb-4">
      <div className="p-3 bg-green-100 rounded-lg text-green-600 group-hover:bg-green-200 transition-colors">
        {icon}
      </div>
      <div className="text-sm font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded">
        {count} available
      </div>
    </div>
    
    <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
    <p className="text-gray-600 text-sm mb-4">{description}</p>
    
    <button className="text-green-600 text-sm font-medium flex items-center group-hover:text-green-700 transition-colors">
      Browse {title}
      <ArrowRight className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1" />
    </button>
  </div>
);

const MarketplacePage: React.FC = () => {
  const router = useRouter();
  const [featuredDevelopers, setFeaturedDevelopers] = useState<DeveloperProfile[]>([]);
  const [featuredVendors, setFeaturedVendors] = useState<VendorProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalDevelopers: 0,
    totalVendors: 0,
    activeProjects: 0,
    avgRating: 0
  });

  useEffect(() => {
    const fetchFeaturedProfiles = async () => {
      try {
        setLoading(true);
        
        // Fetch featured profiles
        const developersResult = await marketplaceService.searchDevelopers({
          topRated: true
        });
        
        const vendorsResult = await marketplaceService.searchVendors({
          topRated: true
        });
        
        setFeaturedDevelopers(developersResult.profiles.slice(0, 4) as DeveloperProfile[]);
        setFeaturedVendors(vendorsResult.profiles.slice(0, 2) as VendorProfile[]);
        
        // Fetch overall stats
        const allDevsResult = await marketplaceService.searchDevelopers();
        const allVendorsResult = await marketplaceService.searchVendors();
        
        const allProfiles = [...allDevsResult.profiles, ...allVendorsResult.profiles];
        const avgRating = allProfiles.length > 0 
          ? allProfiles.reduce((sum, profile) => sum + profile.rating, 0) / allProfiles.length 
          : 0;
        const activeProjects = allProfiles.reduce((sum, profile) => sum + profile.completedProjects, 0);
        
        setStats({
          totalDevelopers: allDevsResult.totalCount,
          totalVendors: allVendorsResult.totalCount,
          activeProjects,
          avgRating: Math.round(avgRating * 10) / 10
        });
        
      } catch (error) {
        console.error('Error fetching marketplace data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFeaturedProfiles();
  }, []);

  const handleViewProfile = (id: string) => {
    router.push(`/marketplace/profile/${id}?type=${featuredDevelopers.find(d => d.id === id) ? 'developer' : 'vendor'}`);
  };

  const handleContact = (id: string) => {
    router.push(`/marketplace/contact/${id}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="animate-pulse space-y-8">
            <div className="h-32 bg-gray-200 rounded-lg"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="h-40 bg-gray-200 rounded-lg"></div>
              <div className="h-40 bg-gray-200 rounded-lg"></div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-24 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
            <div className="h-64 bg-gray-200 rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="bg-white border border-gray-200 rounded-lg p-8 mb-8">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Find Top AI Talent for Your Projects
            </h1>
            <p className="text-gray-600 mb-8">
              Connect with skilled developers and vendors specializing in data annotation, 
              machine learning, and AI development.
            </p>
            
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <StatCard
                icon={<Users className="w-5 h-5" />}
                value={`${stats.totalDevelopers + stats.totalVendors}`}
                label="Experts"
              />
              <StatCard
                icon={<Zap className="w-5 h-5" />}
                value={`${stats.activeProjects}`}
                label="Projects"
              />
              <StatCard
                icon={<Star className="w-5 h-5" />}
                value={`${stats.avgRating}/5`}
                label="Avg Rating"
              />
              <StatCard
                icon={<Award className="w-5 h-5" />}
                value="98%"
                label="Success"
              />
            </div>
          </div>
        </div>

        {/* Marketplace Categories */}
        <div className="mb-12">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Find Talent By Category</h2>
            <p className="text-gray-600">Choose the type of professional you need for your project</p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            <CategoryCard
              title="Developers"
              description="Individual experts specializing in AI, machine learning, and custom development solutions."
              icon={<Code className="w-6 h-6" />}
              count={stats.totalDevelopers}
              onClick={() => router.push('/marketplace/developers')}
            />
            <CategoryCard
              title="Vendors"
              description="Established companies and teams for large-scale data annotation and enterprise AI projects."
              icon={<Building2 className="w-6 h-6" />}
              count={stats.totalVendors}
              onClick={() => router.push('/marketplace/vendors')}
            />
          </div>
        </div>

        {/* Featured Developers */}
        {featuredDevelopers.length > 0 && (
          <div className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Featured Developers</h2>
              <button
                onClick={() => router.push('/marketplace/developers')}
                className="text-green-600 hover:text-green-700 font-medium text-sm flex items-center transition-colors"
              >
                View all developers
                <ArrowRight className="w-4 h-4 ml-1" />
              </button>
            </div>
            
            <div className="grid lg:grid-cols-4 gap-6">
              {featuredDevelopers.map((developer) => (
                <ProfileCard
                  key={developer.id}
                  profile={developer}
                  onViewProfile={handleViewProfile}
                  onContact={handleContact}
                />
              ))}
            </div>
          </div>
        )}

        {/* Featured Vendors */}
        {featuredVendors.length > 0 && (
          <div className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Featured Vendors</h2>
              <button
                onClick={() => router.push('/marketplace/vendors')}
                className="text-green-600 hover:text-green-700 font-medium text-sm flex items-center transition-colors"
              >
                View all vendors
                <ArrowRight className="w-4 h-4 ml-1" />
              </button>
            </div>
            
            <div className="grid lg:grid-cols-2 gap-6">
              {featuredVendors.map((vendor) => (
                <ProfileCard
                  key={vendor.id}
                  profile={vendor}
                  onViewProfile={handleViewProfile}
                  onContact={handleContact}
                />
              ))}
            </div>
          </div>
        )}

        {/* How It Works */}
        <div className="bg-white border border-gray-200 rounded-lg p-8">
          <div className="max-w-3xl mx-auto text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">How It Works</h2>
            <p className="text-gray-600">Get started with our simple process</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Search className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Find Talent</h3>
              <p className="text-gray-600 text-sm">Search our marketplace for developers and vendors that match your project needs.</p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Users className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Connect</h3>
              <p className="text-gray-600 text-sm">Review profiles and contact the professionals you want to work with.</p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Succeed</h3>
              <p className="text-gray-600 text-sm">Collaborate on your project and achieve your goals together.</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default withAuth(MarketplacePage, ['customers', 'developers', 'vendors']);