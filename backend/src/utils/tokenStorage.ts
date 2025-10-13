const ACCESS_TOKEN_KEY = 'stp_access_token';
const REFRESH_TOKEN_KEY = 'stp_refresh_token';
const USER_DATA_KEY = 'stp_user_data';
const LAST_ACTIVITY_KEY = 'stp_last_activity';

// Session timeout: 30 minutes of inactivity
const INACTIVITY_TIMEOUT = 30 * 60 * 1000;

export const tokenStorage = {
  setTokens(accessToken: string, refreshToken: string) {
    sessionStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    this.updateLastActivity();
  },

  getAccessToken(): string | null {
    return sessionStorage.getItem(ACCESS_TOKEN_KEY);
  },

  getRefreshToken(): string | null {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  },

  setUserData(userData: any) {
    sessionStorage.setItem(USER_DATA_KEY, JSON.stringify(userData));
  },

  getUserData(): any | null {
    const data = sessionStorage.getItem(USER_DATA_KEY);
    return data ? JSON.parse(data) : null;
  },

  updateLastActivity() {
    localStorage.setItem(LAST_ACTIVITY_KEY, Date.now().toString());
  },

  getLastActivity(): number {
    const activity = localStorage.getItem(LAST_ACTIVITY_KEY);
    return activity ? parseInt(activity, 10) : 0;
  },

  isSessionExpired(): boolean {
    const lastActivity = this.getLastActivity();
    if (!lastActivity) return true;
    return Date.now() - lastActivity > INACTIVITY_TIMEOUT;
  },

  clearAll() {
    sessionStorage.removeItem(ACCESS_TOKEN_KEY);
    sessionStorage.removeItem(USER_DATA_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(LAST_ACTIVITY_KEY);
  }
};