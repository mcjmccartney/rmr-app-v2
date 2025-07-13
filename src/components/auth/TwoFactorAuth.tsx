'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Shield, Smartphone, Key, AlertTriangle, CheckCircle, X } from 'lucide-react';

interface TwoFactorAuthProps {
  onClose: () => void;
}

export default function TwoFactorAuth({ onClose }: TwoFactorAuthProps) {
  const { enrollMFA, verifyMFA, unenrollMFA, getMFAFactors } = useAuth();
  const [step, setStep] = useState<'list' | 'enroll' | 'verify'>('list');
  const [factors, setFactors] = useState<any[]>([]);
  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');
  const [factorId, setFactorId] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadFactors();
  }, []);

  const loadFactors = async () => {
    setLoading(true);
    const { data, error } = await getMFAFactors();
    if (error) {
      setError(error.message);
    } else {
      setFactors(data?.totp || []);
    }
    setLoading(false);
  };

  const handleEnroll = async () => {
    setLoading(true);
    setError('');
    
    const { data, error } = await enrollMFA();
    if (error) {
      setError(error.message);
    } else {
      setQrCode(data.totp.qr_code);
      setSecret(data.totp.secret);
      setFactorId(data.id);
      setStep('verify');
    }
    setLoading(false);
  };

  const handleVerify = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      setError('Please enter a valid 6-digit code');
      return;
    }

    setLoading(true);
    setError('');
    
    const { error } = await verifyMFA(factorId, verificationCode);
    if (error) {
      setError(error.message);
    } else {
      setSuccess('2FA has been successfully enabled!');
      setStep('list');
      loadFactors();
    }
    setLoading(false);
  };

  const handleUnenroll = async (factorId: string) => {
    if (!confirm('Are you sure you want to disable 2FA? This will make your account less secure.')) {
      return;
    }

    setLoading(true);
    setError('');
    
    const { error } = await unenrollMFA(factorId);
    if (error) {
      setError(error.message);
    } else {
      setSuccess('2FA has been disabled');
      loadFactors();
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Shield className="w-6 h-6 text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-900">Two-Factor Authentication</h2>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Error/Success Messages */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <span className="text-red-700 text-sm">{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="text-green-700 text-sm">{success}</span>
            </div>
          )}

          {/* Content based on step */}
          {step === 'list' && (
            <div>
              <p className="text-gray-600 mb-6">
                Add an extra layer of security to your account with two-factor authentication.
              </p>

              {factors.length === 0 ? (
                <div className="text-center py-8">
                  <Smartphone className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-6">2FA is not enabled on your account</p>
                  <button
                    onClick={handleEnroll}
                    disabled={loading}
                    className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    {loading ? 'Setting up...' : 'Enable 2FA'}
                  </button>
                </div>
              ) : (
                <div>
                  <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-4">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span className="text-green-700 font-medium">2FA is enabled</span>
                    </div>
                  </div>
                  
                  {factors.map((factor) => (
                    <div key={factor.id} className="border rounded-md p-4 mb-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Key className="w-5 h-5 text-gray-600" />
                          <div>
                            <p className="font-medium">{factor.friendly_name}</p>
                            <p className="text-sm text-gray-600">TOTP Authenticator</p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleUnenroll(factor.id)}
                          disabled={loading}
                          className="text-red-600 hover:text-red-700 text-sm disabled:opacity-50"
                        >
                          Disable
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {step === 'verify' && (
            <div>
              <div className="text-center mb-6">
                <h3 className="text-lg font-medium mb-2">Scan QR Code</h3>
                <p className="text-gray-600 text-sm mb-4">
                  Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)
                </p>
                
                {qrCode && (
                  <div className="mb-4">
                    <img src={qrCode} alt="QR Code" className="mx-auto border rounded" />
                  </div>
                )}
                
                <div className="bg-gray-50 p-3 rounded text-xs font-mono break-all mb-4">
                  {secret}
                </div>
                
                <p className="text-gray-600 text-sm mb-4">
                  Or enter this secret key manually in your authenticator app
                </p>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Enter verification code
                </label>
                <input
                  type="text"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-center text-lg font-mono"
                  maxLength={6}
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep('list')}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleVerify}
                  disabled={loading || verificationCode.length !== 6}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Verifying...' : 'Verify & Enable'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
