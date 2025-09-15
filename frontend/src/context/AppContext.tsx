import React, { createContext, useContext } from 'react';
import type { AppState, Country, PaymentScenario } from '../types';
import { useAppState } from '../hooks/useAppState';

interface AppContextType {
  state: AppState;
  loading: boolean;
  error: string | null;
  config: any;
  selectCountry: (country: Country) => void;
  selectScenario: (scenario: PaymentScenario) => void;
  resetSelection: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const appState = useAppState();
  
  return (
    <AppContext.Provider value={appState}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};