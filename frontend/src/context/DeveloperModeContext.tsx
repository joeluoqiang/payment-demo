import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { ApiLogEntry, PendingRedirect } from '../types';
import { apiService } from '../services/api';

interface DeveloperModeContextType {
  enabled: boolean;
  setEnabled: (enabled: boolean) => void;
  logs: ApiLogEntry[];
  sessionId: string | null;
  setSessionId: (sessionId: string | null) => void;
  fetchLogs: () => Promise<void>;
  pendingRedirect: PendingRedirect | null;
  setPendingRedirect: (redirect: PendingRedirect | null) => void;
  executeRedirect: () => void;
}

const DeveloperModeContext = createContext<DeveloperModeContextType | undefined>(undefined);

export const DeveloperModeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [enabled, setEnabled] = useState(false);
  const [logs, setLogs] = useState<ApiLogEntry[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [pendingRedirect, setPendingRedirect] = useState<PendingRedirect | null>(null);

  const fetchLogs = useCallback(async () => {
    if (!sessionId) {
      console.log('[DevMode] No sessionId, skipping fetch');
      return;
    }
    try {
      console.log('[DevMode] Fetching logs for sessionId:', sessionId);
      const fetchedLogs = await apiService.getApiLogs(sessionId);
      console.log('[DevMode] Fetched logs:', fetchedLogs.length, fetchedLogs);
      setLogs(fetchedLogs);
    } catch (err) {
      console.error('[DevMode] Failed to fetch API logs:', err);
    }
  }, [sessionId]);

  const executeRedirect = useCallback(() => {
    if (pendingRedirect) {
      window.location.href = pendingRedirect.url;
    }
  }, [pendingRedirect]);

  // Fetch logs periodically when enabled and sessionId is set
  useEffect(() => {
    console.log('[DevMode] useEffect triggered - enabled:', enabled, 'sessionId:', sessionId);
    if (enabled && sessionId) {
      console.log('[DevMode] Starting polling for sessionId:', sessionId);
      fetchLogs();
      const interval = setInterval(fetchLogs, 2000);
      return () => {
        console.log('[DevMode] Clearing interval');
        clearInterval(interval);
      };
    }
  }, [enabled, sessionId, fetchLogs]);

  return (
    <DeveloperModeContext.Provider
      value={{
        enabled,
        setEnabled,
        logs,
        sessionId,
        setSessionId,
        fetchLogs,
        pendingRedirect,
        setPendingRedirect,
        executeRedirect,
      }}
    >
      {children}
    </DeveloperModeContext.Provider>
  );
};

export const useDeveloperMode = (): DeveloperModeContextType => {
  const context = useContext(DeveloperModeContext);
  if (!context) {
    throw new Error('useDeveloperMode must be used within a DeveloperModeProvider');
  }
  return context;
};

export default DeveloperModeContext;