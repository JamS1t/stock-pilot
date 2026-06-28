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

const valueProps: { taglish: string; en: string }[] = [
  { taglish: 'Benta', en: 'Every sale counted, cash or GCash' },
  { taglish: 'Utang', en: 'Suki balances that never get forgotten' },
  { taglish: 'Stock', en: 'Know what is paubos before it runs out' },
  { taglish: 'Kita', en: 'Daily close with your real profit' },
];

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
          client_id:
            '714854418773-o6gkkqgrnf04nosj4m38qc9v4j5thq69.apps.googleusercontent.com',
          callback: handleCredentialResponse,
        });

        google.accounts.id.renderButton(googleButtonRef.current, {
          theme: 'outline',
          size: 'large',
          text: 'continue_with',
          shape: 'pill',
          width: '300',
        });

        google.accounts.id.prompt();
      } catch (err) {
        // Google SDK not ready yet — the button simply won't render.
      }
    }
  }, [showSetupStoreModal, loading]);

  const handleCredentialResponse = async (response: any) => {
    if (!response.credential) {
      setError('We did not receive a Google sign-in. Please try again.');
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
      setError(err.message || 'Sign-in failed. Please try again.');
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
    setError('Store setup was cancelled. Sign in again to continue.');
  };

  return (
    <div className="flex min-h-screen flex-col bg-paper lg:flex-row">
      {/* Brand / value panel */}
      <section className="on-ink relative flex flex-col justify-between overflow-hidden bg-ink px-8 py-10 text-white lg:w-[46%] lg:px-14 lg:py-14">
        {/* ambient jade glow, subtle */}
        <div className="pointer-events-none absolute -left-24 top-1/3 h-80 w-80 rounded-full bg-rail-active/10 blur-3xl" />
        <div className="pointer-events-none absolute -right-16 bottom-0 h-72 w-72 rounded-full bg-peso/10 blur-3xl" />

        <div className="relative z-10 flex items-center gap-3">
          <img src="/stockpilot-logo.png" alt="" width={40} height={40} />
          <div className="leading-tight">
            <div className="font-display text-xl font-bold tracking-tight">StockPilot</div>
            <div className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-rail-active">
              Counter&nbsp;AI
            </div>
          </div>
        </div>

        <div className="relative z-10 my-12 max-w-md lg:my-0">
          <p className="eyebrow text-rail-active">Para sa tindahan mo</p>
          <h1 className="mt-3 font-display text-3xl font-bold leading-tight tracking-tight lg:text-[2.6rem]">
            Bantay sa benta, stock, utang, at kita.
          </h1>
          <p className="mt-4 text-base leading-relaxed text-rail-text">
            The offline-ready counter for serious small retailers. Sell faster, close
            the day with your real numbers, and never lose track of who owes you.
          </p>

          <ul className="mt-8 space-y-3">
            {valueProps.map((v) => (
              <li key={v.taglish} className="flex items-start gap-3">
                <span className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-rail-active/20 text-rail-active">
                  <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 10l4 4 8-9" />
                  </svg>
                </span>
                <span className="text-sm text-rail-text">
                  <span className="font-semibold text-white">{v.taglish}</span>
                  <span className="text-rail-muted"> — {v.en}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative z-10 text-xs text-rail-muted">
          Works even when the internet is bad. Your counter keeps running.
        </p>
      </section>

      {/* Sign-in panel */}
      <section className="flex flex-1 items-center justify-center px-6 py-12 sm:px-10">
        <div className="w-full max-w-sm animate-fade-in">
          <div className="card p-8">
            <h2 className="font-display text-2xl font-bold tracking-tight text-ink">
              Sign in to your counter
            </h2>
            <p className="mt-1.5 text-sm text-muted">
              Use your Google account to open the store.
            </p>

            <div className="mt-8 min-h-[120px]">
              {loading ? (
                <div className="flex flex-col items-center justify-center gap-3 py-6">
                  <div className="h-10 w-10 animate-spin rounded-full border-2 border-line border-t-peso" />
                  <p className="text-sm font-medium text-muted">Opening your counter…</p>
                </div>
              ) : (
                <div className={showSetupStoreModal ? 'hidden' : 'flex flex-col items-center gap-5'}>
                  <div ref={googleButtonRef} className="flex justify-center" />
                  <div className="flex w-full items-center gap-3 text-xs text-faint">
                    <span className="h-px flex-1 bg-line" />
                    <span>Secure Google sign-in</span>
                    <span className="h-px flex-1 bg-line" />
                  </div>
                </div>
              )}

              {error && (
                <div className="mt-5 rounded-xl border border-danger/30 bg-danger-tint px-4 py-3 text-sm text-danger">
                  {error}
                </div>
              )}
            </div>
          </div>

          <p className="mt-6 text-center text-xs text-faint">
            By continuing you agree to the Terms of Service and Privacy Policy.
          </p>
        </div>
      </section>

      {showSetupStoreModal && newUserData && (
        <SetupStoreModal
          userId={newUserData.user_id}
          onStoreSetupComplete={handleStoreSetupComplete}
          onClose={handleCloseSetupStoreModal}
        />
      )}
    </div>
  );
};

export default LoginPage;
