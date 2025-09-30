'use client';

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { ChevronDown, User as UserIcon, Settings, LogOut, HelpCircle, Code, Building2, Users, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { logout } from '@/services/keycloak';
import { User as UserType } from '@/types';

const getUserInitials = (name: string): string => {
  return name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

// User dropdown menu component
const UserDropdownMenu = ({ user, onClose }: { user: UserType; onClose: () => void }) => {
  const menuRef = useRef<HTMLDivElement>(null);

  const handleSignOut = async () => {
    await logout();
    window.location.href = '/signin';
    onClose();
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  const menuItems = [
    { icon: UserIcon, label: 'Profile', href: '/profile' },
    { icon: Settings, label: 'Settings', href: '/settings' },
    { icon: HelpCircle, label: 'Help & Support', href: '/help' },
  ];

  return (
    <div 
      ref={menuRef}
      className="absolute right-0 top-full mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-50 animate-in fade-in slide-in-from-top-2"
    >
      {/* User info section */}
      <div className="px-4 py-3 border-b border-gray-100">
        <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
        <p className="text-xs text-gray-500 truncate mt-1">{user.email}</p>
      </div>

      {/* Menu items */}
      <div className="py-1">
        {menuItems.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-150"
            onClick={onClose}
          >
            <item.icon className="w-4 h-4 mr-3 text-gray-400" strokeWidth={1.75} />
            <span>{item.label}</span>
          </Link>
        ))}
      </div>

      {/* Sign out button */}
      <div className="py-1 border-t border-gray-100">
        <button
          onClick={handleSignOut}
          className="flex items-center px-4 py-2 text-sm text-red-600 hover:bg-gray-50 w-full text-left transition-colors duration-150 cursor-pointer"
        >
          <LogOut className="w-4 h-4 mr-3" strokeWidth={1.75} />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
};

// Main header component
interface HeaderProps {
  className?: string;
}

export const Header: React.FC<HeaderProps> = ({ className = "" }) => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { user, loading } = useAuth();

  // Close menus when clicking outside
  useEffect(() => {
    const handleGlobalClick = () => {
      setShowUserMenu(false);
    };

    if (showUserMenu) {
      document.addEventListener('click', handleGlobalClick);
      return () => document.removeEventListener('click', handleGlobalClick);
    }
  }, [showUserMenu]);

  if (loading) {
    return (
  <header className={`bg-white border-b border-gray-200 px-5 py-2 flex justify-between items-center text-sm ${className}`}>
    <div className="flex items-center space-x-6">
          <Link href="/projects" className="flex items-center group" aria-label="CrowdEval Home">
            <Image
              src="/logo.png"
              alt="CrowdEval"
              width={140}
              height={32}
              priority
      className="h-6 w-auto object-contain transition-transform duration-200 group-hover:scale-[1.04]"
            />
            <span className="sr-only">CrowdEval</span>
          </Link>
      <nav className="hidden md:flex items-center space-x-5">
            <Link href="/projects" className="text-sm font-medium text-gray-600 hover:text-green-700 transition-colors">Projects</Link>
            <Link href="/marketplace" className="text-sm font-medium text-gray-600 hover:text-green-700 transition-colors">Hire Candidates</Link>
            <Link href="/documentation" className="text-sm font-medium text-gray-600 hover:text-green-700 transition-colors">Documentation</Link>
          </nav>
        </div>
        <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse" />
      </header>
    );
  }

  if (!user) {
    return (
  <header className={`bg-white border-b border-gray-200 px-5 py-2 flex justify-between items-center text-sm ${className}`}>
    <div className="flex items-center space-x-6">
          <Link href="/projects" className="flex items-center group" aria-label="CrowdEval Home">
          <span className="sr-only">CrowdEval</span>
          </Link>
      <nav className="hidden md:flex items-center space-x-5">
            <Link href="/projects" className="text-sm font-medium text-gray-600 hover:text-green-700 transition-colors">Projects</Link>
            <Link href="/marketplace" className="text-sm font-medium text-gray-600 hover:text-green-700 transition-colors">Hire Candidates</Link>
            <Link href="/documentation" className="text-sm font-medium text-gray-600 hover:text-green-700 transition-colors">Documentation</Link>
          </nav>
        </div>
        <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse" />
      </header>
    );
  }

  const derivedName = user.name || user.given_name || user.preferred_username || 'Unknown User';
  const userProfile: UserType = {
    id: user.sub,
    name: derivedName,
    email: user.email || 'No email provided',
    avatar: '',
    avatarUrl: undefined,
    createdAt: new Date(),
    userId: user.sub,
    role: 'viewer', // default role until real RBAC mapping implemented
    userType: user.authType === 'developers' ? 'developer' : user.authType === 'vendors' ? 'vendor' : 'client',
    isActive: true,
  };

  return (
    <header className={`bg-white border-b border-gray-200 px-5 py-2 flex justify-between items-center text-sm ${className}`}>
      <div className="flex items-center space-x-6">
        <Link href="/projects" className="flex items-center group" aria-label="CrowdEval Home">
          <Image
            src="/logo.png"
            alt="CrowdEval"
            width={140}
            height={32}
            priority
            className="h-6 w-auto object-contain transition-transform duration-200 group-hover:scale-[1.04]"
          />
          <span className="sr-only">CrowdEval</span>
        </Link>
        <nav className="hidden md:flex items-center space-x-8">
          <Link 
            href="/marketplace" 
            className="text-gray-700 hover:text-green-600 font-medium transition-colors"
          >
            Hire Candidates
          </Link>
          <Link 
            href="/projects" 
            className="text-gray-700 hover:text-green-600 font-medium transition-colors"
          >
            Projects
          </Link>
          <Link 
            href="/team" 
            className="text-gray-700 hover:text-green-600 font-medium transition-colors"
          >
            Post Projects
          </Link>
        </nav>
        
        {/* Mobile Hire Candidates Link */}
        <div className="md:hidden">
          <Link href="/marketplace" className="p-2 text-gray-600 hover:text-green-700 transition-colors" aria-label="Hire Candidates">
            <Users className="w-5 h-5" />
          </Link>
        </div>
      </div>
      
      <div className="relative">
        <button
          onClick={() => {
            setShowUserMenu(!showUserMenu);
          }}
      className="flex items-center space-x-3 hover:bg-gray-50 rounded-lg px-2.5 py-1.5 transition-colors duration-150"
          aria-label="User menu"
          aria-expanded={showUserMenu}
          aria-haspopup="true"
        >
      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-xs font-semibold shadow-sm">
            {getUserInitials(userProfile.name)}
          </div>
          <div className="hidden sm:block">
            <div className="text-right">
        <p className="text-[13px] font-medium text-gray-900 truncate max-w-[140px] leading-tight">{userProfile.name}</p>
        <p className="text-[11px] text-gray-500 truncate max-w-[140px] leading-tight">{userProfile.email}</p>
            </div>
          </div>
          <ChevronDown 
            className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${showUserMenu ? 'rotate-180' : ''}`} 
            strokeWidth={2}
          />
        </button>
        
        {showUserMenu && (
          <UserDropdownMenu
            user={userProfile}
            onClose={() => setShowUserMenu(false)}
          />
        )}
      </div>
    </header>
  );
};

export default Header;
