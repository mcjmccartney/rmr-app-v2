'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Shield, User, Key, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import TwoFactorAuth from '@/components/auth/TwoFactorAuth';

export default function SettingsPage() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [show2FA, setShow2FA] = useState(false);

  const handleSignOut = async () => {
    if (confirm('Are you sure you want to sign out?')) {
      await signOut();
      router.push('/login');
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#ebeadf' }}>
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        </div>

        <div className="grid gap-6">
          {/* Account Information */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <User className="w-6 h-6 text-gray-600" />
              <h2 className="text-xl font-semibold text-gray-900">Account Information</h2>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <div className="text-gray-900 bg-gray-50 px-3 py-2 rounded-md">
                  {user?.email}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">User ID</label>
                <div className="text-gray-600 bg-gray-50 px-3 py-2 rounded-md font-mono text-sm">
                  {user?.id}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Last Sign In</label>
                <div className="text-gray-600 bg-gray-50 px-3 py-2 rounded-md">
                  {user?.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString() : 'Never'}
                </div>
              </div>
            </div>
          </div>

          {/* Security Settings */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <Shield className="w-6 h-6 text-gray-600" />
              <h2 className="text-xl font-semibold text-gray-900">Security</h2>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center gap-3">
                  <Key className="w-5 h-5 text-gray-600" />
                  <div>
                    <h3 className="font-medium text-gray-900">Two-Factor Authentication</h3>
                    <p className="text-sm text-gray-600">Add an extra layer of security to your account</p>
                  </div>
                </div>
                <button
                  onClick={() => setShow2FA(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                >
                  Manage 2FA
                </button>
              </div>
              
              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div>
                  <h3 className="font-medium text-gray-900">Password</h3>
                  <p className="text-sm text-gray-600">Change your account password</p>
                </div>
                <button
                  onClick={() => {
                    // This would typically open a password change modal
                    alert('Password change functionality would be implemented here');
                  }}
                  className="border border-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Change Password
                </button>
              </div>
            </div>
          </div>

          {/* Privacy & Search Engine Blocking */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <Shield className="w-6 h-6 text-gray-600" />
              <h2 className="text-xl font-semibold text-gray-900">Privacy & Security</h2>
            </div>
            
            <div className="space-y-4">
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="w-5 h-5 text-green-600" />
                  <h3 className="font-medium text-green-900">Search Engine Protection</h3>
                </div>
                <p className="text-sm text-green-700">
                  ✓ This application is blocked from search engines<br/>
                  ✓ robots.txt prevents crawling<br/>
                  ✓ Meta tags block indexing<br/>
                  ✓ Security headers prevent caching
                </p>
              </div>
              
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="w-5 h-5 text-blue-600" />
                  <h3 className="font-medium text-blue-900">Security Headers</h3>
                </div>
                <p className="text-sm text-blue-700">
                  ✓ Content Security Policy enabled<br/>
                  ✓ XSS protection active<br/>
                  ✓ Frame protection enabled<br/>
                  ✓ Rate limiting in place
                </p>
              </div>
            </div>
          </div>

          {/* Sign Out */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Account Actions</h2>
            
            <button
              onClick={handleSignOut}
              className="bg-red-600 text-white px-6 py-2 rounded-md hover:bg-red-700 transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>

      {/* 2FA Modal */}
      {show2FA && (
        <TwoFactorAuth onClose={() => setShow2FA(false)} />
      )}
    </div>
  );
}
