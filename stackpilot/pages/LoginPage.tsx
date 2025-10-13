import React, { useEffect, useRef, useState } from 'react';
import SetupStoreModal from '../components/SetupStoreModal';
import { useAuth } from '../context/AuthContext';
import { googleLogin, setupStore } from '../utils/api';

declare const google: any;

interface StoreSetupData {
  user_id: number;
  store_name: string;
  timezone: string;
  currency: string;
}

const LoginPage: React.FC = () => {
  const { login: authContextLogin } = useAuth();
  const googleButtonRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showSetupStoreModal, setShowSetupStoreModal] = useState(false);
  const [newUserData, setNewUserData] = useState<any>(null);

  useEffect(() => {
    if (google && googleButtonRef.current && !loading && !showSetupStoreModal) {
      try {
        google.accounts.id.initialize({
          client_id: "714854418773-o6gkkqgrnf04nosj4m38qc9v4j5thq69.apps.googleusercontent.com",
          callback: handleCredentialResponse,
        });

        google.accounts.id.renderButton(
          googleButtonRef.current,
          { 
            theme: 'filled_black',
            size: 'large', 
            text: 'signin_with',
            shape: 'pill',
            width: '280'
          }
        );

        google.accounts.id.prompt();
      } catch (err) {
        // console.error('Error initializing Google Sign-In:', err);
      }
    }
  }, [showSetupStoreModal, loading]);

  const handleCredentialResponse = async (response: any) => {
    if (!response.credential) {
      setError('No credential received from Google');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const data = await googleLogin(response.credential);

      if (data.newUser === true) {
        setNewUserData(data.user);
        setShowSetupStoreModal(true);
      } else {
        authContextLogin(data);
      }
    } catch (err: any) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleStoreSetupComplete = async (storeSetupData: StoreSetupData) => {
    setLoading(true);
    setError('');

    try {
      const response = await setupStore(
        storeSetupData.user_id,
        storeSetupData.store_name,
        storeSetupData.timezone,
        storeSetupData.currency
      );
      
      setShowSetupStoreModal(false);
      authContextLogin(response);
    } catch (err: any) {
      setError(err.message || 'Store setup failed. Please try again.');
      throw err;
    } finally {
      setLoading(false);
      setNewUserData(null);
    }
  };

  const handleCloseSetupStoreModal = () => {
    setShowSetupStoreModal(false);
    setNewUserData(null);
    setError('Store setup was cancelled. Please sign in again to continue.');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 flex items-center justify-center p-4 sm:p-6 lg:p-8 font-sans relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-20 w-72 h-72 bg-sky-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-700"></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="backdrop-blur-xl bg-gray-900/80 rounded-3xl shadow-2xl border border-gray-800/50 p-8 sm:p-10 space-y-8 transform transition-all hover:shadow-sky-500/10 hover:shadow-3xl">
          {/* Logo and Header */}
          <div className="text-center space-y-4">
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="absolute inset-0 bg-sky-500/20 blur-xl rounded-full animate-pulse"></div>
                <img 
                  src="/stockpilot-logo.png" 
                  alt="StockPilot Logo" 
                  className="w-14 h-14 relative z-10 drop-shadow-2xl"
                />
              </div>
            </div>
            
            <h1 className="text-4xl sm:text-5xl font-bold text-white tracking-tight">
              Stock<span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-blue-500">Pilot</span>
            </h1>
            
            <p className="text-gray-500 text-xs tracking-wide">By James Carl Sitsit</p>
            
            <div className="pt-2">
              <p className="text-gray-400 text-sm font-light">Welcome back</p>
              <p className="text-gray-500 text-xs mt-1">Sign in to continue to your dashboard</p>
            </div>
          </div>

          {/* Main Content */}
          <div className="space-y-6">
            {loading && (
              <div className="flex flex-col items-center justify-center py-6 space-y-3">
                <div className="relative">
                  <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-800"></div>
                  <div className="animate-spin rounded-full h-12 w-12 border-4 border-t-sky-500 absolute inset-0"></div>
                </div>
                <p className="text-sky-400 text-sm font-medium">Authenticating...</p>
              </div>
            )}
            
            {error && (
              <div className="relative overflow-hidden rounded-xl p-4 bg-gradient-to-r from-red-500/10 to-red-600/10 border border-red-500/20 backdrop-blur-sm">
                <div className="absolute inset-0 bg-red-500/5 animate-pulse"></div>
                <p className="text-sm text-red-400 text-center relative z-10 font-medium">{error}</p>
              </div>
            )}
            
            {/* Google Button Container with custom styling */}
            <div className={`flex flex-col items-center space-y-4 ${loading || showSetupStoreModal ? 'hidden' : ''}`}>
              <div className="w-full flex justify-center">
                <div 
                  ref={googleButtonRef}
                  className="google-btn-wrapper [&>div]:!rounded-full [&>div]:!border-gray-700 [&>div]:!shadow-lg [&>div]:hover:!shadow-sky-500/20 [&>div]:hover:!border-sky-500/50 [&>div]:transition-all [&>div]:duration-300 [&>div]:!bg-gray-800/50 [&>div]:backdrop-blur-sm"
                />
              </div>
              
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <div className="h-px w-12 bg-gradient-to-r from-transparent to-gray-700"></div>
                <span>Secure authentication</span>
                <div className="h-px w-12 bg-gradient-to-l from-transparent to-gray-700"></div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="pt-6 border-t border-gray-800/50">
            <p className="text-center text-xs text-gray-600">
              By continuing, you agree to our Terms of Service and Privacy Policy
            </p>
          </div>
        </div>

        {/* Bottom accent */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-600">
            Need help? <a href="#" className="text-sky-400 hover:text-sky-300 transition-colors">Contact Support</a>
          </p>
        </div>
      </div>

      {showSetupStoreModal && newUserData && (
        <SetupStoreModal
          userId={newUserData.user_id}
          onStoreSetupComplete={handleStoreSetupComplete}
          onClose={handleCloseSetupStoreModal}
        />
      )}

      <style>{`
        @keyframes delay-700 {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 0.8; }
        }
        .delay-700 {
          animation-delay: 700ms;
        }
        
        /* Custom Google button styling */
        .google-btn-wrapper > div {
          transition: all 0.3s ease !important;
        }
      `}</style>
    </div>
  );
};

export default LoginPage;