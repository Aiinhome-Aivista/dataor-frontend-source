import React, { createContext, useContext, useState } from 'react';
import { Connector } from '../features/connectors/types';

interface ConnectorContextType {
  selectedConnector: Connector | null;
  setSelectedConnector: (connector: Connector | null) => void;
  connectorResults: any | null;
  setConnectorResults: (results: any | null) => void;
  isImporting: boolean;
  setIsImporting: (isImporting: boolean) => void;
  searchTopic: string;
  setSearchTopic: (topic: string) => void;
  sessionSources: any | null;
  setSessionSources: (sources: any | null) => void;
  isAnalyzing: boolean;
  setIsAnalyzing: (isAnalyzing: boolean) => void;
  resetConnectorState: () => void;
}

const ConnectorContext = createContext<ConnectorContextType | undefined>(undefined);

export const ConnectorProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedConnector, setSelectedConnector] = useState<Connector | null>(null);
  const [connectorResults, setConnectorResultsState] = useState<any | null>(() => {
    try {
      const sessionId = localStorage.getItem('DAgent_session_id');
      if (sessionId) {
        const stored = localStorage.getItem(`connector_results_${sessionId}`);
        return stored ? JSON.parse(stored) : null;
      }
    } catch (e) {
      console.error('Failed to parse stored connector results', e);
    }
    return null;
  });
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [searchTopic, setSearchTopic] = useState('');
  const [sessionSources, setSessionSourcesState] = useState<any | null>(() => {
    try {
      const sessionId = localStorage.getItem('DAgent_session_id');
      if (sessionId) {
        const stored = localStorage.getItem(`session_sources_${sessionId}`);
        return stored ? JSON.parse(stored) : null;
      }
    } catch (e) {
      console.error('Failed to parse stored session sources', e);
    }
    return null;
  });

  const setConnectorResults = (results: any | null) => {
    setConnectorResultsState(results);
    try {
      const sessionId = localStorage.getItem('DAgent_session_id');
      if (sessionId) {
        if (results) {
          localStorage.setItem(`connector_results_${sessionId}`, JSON.stringify(results));
        } else {
          localStorage.removeItem(`connector_results_${sessionId}`);
        }
      }
    } catch (e) {
      console.error('Failed to store connector results', e);
    }
  };

  const setSessionSources = (sources: any | null) => {
    setSessionSourcesState(sources);
    try {
      const sessionId = localStorage.getItem('DAgent_session_id');
      if (sessionId && sources) {
        localStorage.setItem(`session_sources_${sessionId}`, JSON.stringify(sources));
      }
    } catch (e) {
      console.error('Failed to store session sources', e);
    }
  };

  const resetConnectorState = () => {
    try {
      const sessionId = localStorage.getItem('DAgent_session_id');
      if (sessionId) {
        localStorage.removeItem(`connector_results_${sessionId}`);
        localStorage.removeItem(`session_sources_${sessionId}`);
      }
    } catch (e) {
      console.error('Failed to clear storage on reset', e);
    }

    setSelectedConnector(null);
    setConnectorResultsState(null);
    setIsImporting(false);
    setIsAnalyzing(false);
    setSearchTopic('');
    setSessionSourcesState(null);
  };

  return (
    <ConnectorContext.Provider value={{
      selectedConnector,
      setSelectedConnector,
      connectorResults,
      setConnectorResults,
      isImporting,
      setIsImporting,
      searchTopic,
      setSearchTopic,
      sessionSources,
      setSessionSources,
      isAnalyzing,
      setIsAnalyzing,
      resetConnectorState
    }}>
      {children}
    </ConnectorContext.Provider>
  );
};

export const useConnectorContext = () => {
  const context = useContext(ConnectorContext);
  if (context === undefined) {
    throw new Error('useConnectorContext must be used within a ConnectorProvider');
  }
  return context;
};
