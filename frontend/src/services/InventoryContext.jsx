import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { 
  getSessions as fetchSessions, 
  createSession as apiCreateSession,
  deleteSession as apiDeleteSession,
  getSessionItems as fetchSessionItems,
  addSessionItem as apiAddSessionItem,
  updateSessionItem as apiUpdateSessionItem,
  getProduct as apiGetProduct
} from '../services/api';

const InventoryContext = createContext();

export const useInventory = () => {
  const context = useContext(InventoryContext);
  if (!context) {
    throw new Error('useInventory must be used within an InventoryProvider');
  }
  return context;
};

export const InventoryProvider = ({ children }) => {
  const [sessions, setSessions] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [sessionItems, setSessionItems] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [config, setConfig] = useState({
    googleSheetsUrl: localStorage.getItem('google_sheets_url') || '',
    fastScanMode: localStorage.getItem('fast_scan_mode') === 'true'
  });

  // Load sessions on mount
  useEffect(() => {
    setSessions(fetchSessions());
  }, []);

  // Load items when active session changes
  useEffect(() => {
    if (activeSession) {
      fetchSessionItems(activeSession.id).then(setSessionItems);
    } else {
      setSessionItems([]);
    }
  }, [activeSession]);

  const refreshSessions = useCallback(() => {
    setSessions(fetchSessions());
  }, []);

  const createSession = useCallback((name, type) => {
    const newSession = apiCreateSession(name, type);
    refreshSessions();
    setActiveSession(newSession);
    return newSession;
  }, [refreshSessions]);

  const deleteSession = useCallback((id) => {
    apiDeleteSession(id);
    refreshSessions();
    if (activeSession?.id === id) {
      setActiveSession(null);
    }
  }, [activeSession, refreshSessions]);

  const addItem = useCallback(async (ean, systemQty, physicalQty) => {
    if (!activeSession) return;
    await apiAddSessionItem(activeSession.id, ean, systemQty, physicalQty);
    const items = await fetchSessionItems(activeSession.id);
    setSessionItems(items);
  }, [activeSession]);

  const updateItem = useCallback(async (ean, systemQty, physicalQty) => {
    if (!activeSession) return;
    await apiUpdateSessionItem(activeSession.id, ean, systemQty, physicalQty);
    const items = await fetchSessionItems(activeSession.id);
    setSessionItems(items);
  }, [activeSession]);

  const updateConfig = useCallback((newConfig) => {
    const updated = { ...config, ...newConfig };
    setConfig(updated);
    if (newConfig.googleSheetsUrl !== undefined) {
      localStorage.setItem('google_sheets_url', newConfig.googleSheetsUrl);
    }
    if (newConfig.fastScanMode !== undefined) {
      localStorage.setItem('fast_scan_mode', String(newConfig.fastScanMode));
    }
  }, [config]);

  const value = {
    sessions,
    activeSession,
    setActiveSession,
    sessionItems,
    isLoading,
    setIsLoading,
    config,
    updateConfig,
    createSession,
    deleteSession,
    addItem,
    updateItem,
    refreshSessions
  };

  return (
    <InventoryContext.Provider value={value}>
      {children}
    </InventoryContext.Provider>
  );
};
