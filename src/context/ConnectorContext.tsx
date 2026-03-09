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
}

const ConnectorContext = createContext<ConnectorContextType | undefined>(undefined);

export const ConnectorProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedConnector, setSelectedConnector] = useState<Connector | null>(null);
  const [connectorResults, setConnectorResults] = useState<any | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [searchTopic, setSearchTopic] = useState('');

  return (
    <ConnectorContext.Provider value={{
      selectedConnector,
      setSelectedConnector,
      connectorResults,
      setConnectorResults,
      isImporting,
      setIsImporting,
      searchTopic,
      setSearchTopic
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
