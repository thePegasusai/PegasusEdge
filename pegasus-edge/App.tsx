
import React, { useState, useEffect, createContext, useContext } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import ToolsPage from './pages/ToolsPage';
import SubscriptionPage from './pages/SubscriptionPage';
import { API_KEY_CHECK_MESSAGE, SparklesIcon, PEGASUS_APP_TITLE, LOCAL_STORAGE_USER_PROFILE_KEY } from './constants';
import type { UserProfile } from './types';
import { UserSubscriptionTier } from './types';

// Subscription Context
interface SubscriptionContextType {
  userProfile: UserProfile;
  updateUserProfile: (newProfileData: Partial<UserProfile>) => void;
  isSubscribed: () => boolean;
  canUseCreatorStudioFree: () => boolean;
  consumeCreatorStudioFreeUse: () => void;
}

const defaultUserProfile: UserProfile = {
  tier: UserSubscriptionTier.FREE_STUDIO_USE_AVAILABLE,
  creatorsStudioFreeUseConsumed: false,
};

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
};

const SubscriptionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    try {
      const storedProfile = localStorage.getItem(LOCAL_STORAGE_USER_PROFILE_KEY);
      if (storedProfile) {
        const parsed = JSON.parse(storedProfile);
        // Basic validation
        if (parsed && typeof parsed.tier === 'string' && typeof parsed.creatorsStudioFreeUseConsumed === 'boolean') {
            return parsed;
        }
      }
    } catch (error) {
      console.error("Error reading user profile from localStorage:", error);
    }
    return defaultUserProfile;
  });

  useEffect(() => {
    try {
        localStorage.setItem(LOCAL_STORAGE_USER_PROFILE_KEY, JSON.stringify(userProfile));
    } catch (error) {
        console.error("Error saving user profile to localStorage:", error);
    }
  }, [userProfile]);

  const updateUserProfile = (newProfileData: Partial<UserProfile>) => {
    setUserProfile(prev => ({ ...prev, ...newProfileData }));
  };
  
  const isSubscribed = () => {
    return userProfile.tier === UserSubscriptionTier.MONTHLY || userProfile.tier === UserSubscriptionTier.LIFETIME;
  };

  const canUseCreatorStudioFree = () => {
    return userProfile.tier === UserSubscriptionTier.FREE_STUDIO_USE_AVAILABLE && !userProfile.creatorsStudioFreeUseConsumed;
  };

  const consumeCreatorStudioFreeUse = () => {
    if (canUseCreatorStudioFree()) {
      updateUserProfile({ 
        creatorsStudioFreeUseConsumed: true,
        tier: UserSubscriptionTier.POST_FREE_STUDIO_USE 
      });
    }
  };

  return (
    <SubscriptionContext.Provider value={{ userProfile, updateUserProfile, isSubscribed, canUseCreatorStudioFree, consumeCreatorStudioFreeUse }}>
      {children}
    </SubscriptionContext.Provider>
  );
};


const App: React.FC = () => {
  const [apiKeyAvailable, setApiKeyAvailable] = useState<boolean | null>(null);

  useEffect(() => {
    if (typeof process === 'object' && 
        process.env && 
        typeof process.env.API_KEY === 'string' && 
        process.env.API_KEY.trim() !== '') {
        setApiKeyAvailable(true);
    } else {
        setApiKeyAvailable(false);
    }
  }, []);

  if (apiKeyAvailable === null) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 p-4">
        <SparklesIcon className="w-16 h-16 text-purple-500 animate-pulse mb-4" />
        <p className="text-slate-300 text-lg font-display">Initializing {PEGASUS_APP_TITLE}...</p>
      </div>
    );
  }

  if (!apiKeyAvailable) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-red-900/80 p-6 text-center">
        <SparklesIcon className="w-20 h-20 text-red-400 mb-6" />
        <h1 className="text-3xl font-bold text-red-300 mb-4 font-display">Configuration Error</h1>
        <p className="text-red-200 text-lg max-w-md">
          {API_KEY_CHECK_MESSAGE}
        </p>
        <p className="text-sm text-slate-400 mt-4">
          Please ensure the <code>API_KEY</code> is correctly set up in your environment.
          The application cannot function without it. For development, you might need to set it in a <code>.env</code> file or pass it during the build process.
        </p>
      </div>
    );
  }
  
  return (
    <SubscriptionProvider>
      <HashRouter>
        <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100">
          <Navbar />
          <main className="flex-grow container mx-auto px-4 py-8">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/tools" element={<ToolsPage />} />
              <Route path="/tools/:toolId" element={<ToolsPage />} />
              <Route path="/subscriptions" element={<SubscriptionPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </HashRouter>
    </SubscriptionProvider>
  );
};

export default App;

