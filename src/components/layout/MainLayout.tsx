'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading, signOut } = useAuth();
  const pathname = usePathname();

  const isActive = (path: string) => {
    return pathname === path;
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <Link href="/" className="text-2xl font-bold text-indigo-600">
                  SocialSage
                </Link>
              </div>
              <nav className="ml-6 hidden sm:flex space-x-8 items-center">
                <Link 
                  href="/" 
                  className={`${isActive('/') ? 'text-indigo-600 border-indigo-500' : 'text-gray-500 border-transparent'} hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
                >
                  Home
                </Link>
                {user && (
                  <Link 
                    href="/dashboard" 
                    className={`${isActive('/dashboard') ? 'text-indigo-600 border-indigo-500' : 'text-gray-500 border-transparent'} hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
                  >
                    Dashboard
                  </Link>
                )}
                {/* VIRAL TEMPLATES LINK - DESKTOP */}
                {user && (
                  <Link 
                    href="/viral-templates" 
                    className={`${isActive('/viral-templates') ? 'text-indigo-600 border-indigo-500' : 'text-gray-500 border-transparent'} hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
                  >
                    🚀 Viral Templates
                  </Link>
                )}
                {/* Add the debug link here, only in development mode and for logged-in users */}
                {process.env.NODE_ENV === 'development' && user && (
                  <Link 
                    href="/debug/mock-data" 
                    className={`${isActive('/debug/mock-data') ? 'text-indigo-600 border-indigo-500' : 'text-gray-500 border-transparent'} hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
                  >
                    Mock Data Debug
                  </Link>
                )}
                <Link 
                  href="/about" 
                  className={`${isActive('/about') ? 'text-indigo-600 border-indigo-500' : 'text-gray-500 border-transparent'} hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
                >
                  About
                </Link>
              </nav>
            </div>
            <div className="flex items-center">
              {isLoading ? (
                <div className="text-sm text-gray-500">Loading...</div>
              ) : user ? (
                <div className="flex items-center space-x-4">
                  <span className="hidden md:block text-sm text-gray-500">
                    {user.email}
                  </span>
                  <button
                    onClick={() => signOut()}
                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200"
                  >
                    Sign Out
                  </button>
                </div>
              ) : (
                <>
                  <Link 
                    href="/login" 
                    className="text-gray-500 hover:text-gray-700 text-sm font-medium"
                  >
                    Log In
                  </Link>
                  <Link
                    href="/signup"
                    className="ml-4 inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile menu */}
      <div className="sm:hidden bg-white shadow-sm border-t">
        <div className="py-2">
          <nav className="flex justify-between px-4">
            <Link
              href="/"
              className={`${isActive('/') ? 'text-indigo-600' : 'text-gray-600'} block py-2 px-3 rounded-md text-base font-medium`}
            >
              Home
            </Link>
            {user && (
              <Link
                href="/dashboard"
                className={`${isActive('/dashboard') ? 'text-indigo-600' : 'text-gray-600'} block py-2 px-3 rounded-md text-base font-medium`}
              >
                Dashboard
              </Link>
            )}
            {/* VIRAL TEMPLATES LINK - MOBILE */}
            {user && (
              <Link
                href="/viral-templates"
                className={`${isActive('/viral-templates') ? 'text-indigo-600' : 'text-gray-600'} block py-2 px-3 rounded-md text-base font-medium`}
              >
                🚀 Templates
              </Link>
            )}
            {/* Add the debug link in mobile menu too */}
            {process.env.NODE_ENV === 'development' && user && (
              <Link
                href="/debug/mock-data"
                className={`${isActive('/debug/mock-data') ? 'text-indigo-600' : 'text-gray-600'} block py-2 px-3 rounded-md text-base font-medium`}
              >
                Debug
              </Link>
            )}
            <Link
              href="/about"
              className={`${isActive('/about') ? 'text-indigo-600' : 'text-gray-600'} block py-2 px-3 rounded-md text-base font-medium`}
            >
              About
            </Link>
          </nav>
        </div>
      </div>

      {/* Main content */}
      <main className="flex-grow">
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="md:flex md:items-center md:justify-between">
            <div className="flex justify-center md:justify-start">
              <Link href="/" className="text-xl font-bold text-indigo-600">
                SocialSage
              </Link>
            </div>
            <div className="mt-8 md:mt-0">
              <ul className="flex justify-center md:justify-start space-x-6">
                <li>
                  <Link href="/terms" className="text-gray-400 hover:text-gray-600">
                    Terms
                  </Link>
                </li>
                <li>
                  <Link href="/privacy" className="text-gray-400 hover:text-gray-600">
                    Privacy
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="text-gray-400 hover:text-gray-600">
                    Contact
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-8 border-t border-gray-200 pt-8 text-center md:text-left">
            <p className="text-sm text-gray-500">
              &copy; 2025 SocialSage. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}