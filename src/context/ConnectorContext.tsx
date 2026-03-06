import React, { createContext, useContext, useState } from 'react';
import { Connector } from '../features/connectors/types';

interface ConnectorContextType {
  selectedConnector: Connector | null;
  setSelectedConnector: (connector: Connector | null) => void;
}

const ConnectorContext = createContext<ConnectorContextType | undefined>(undefined);

export const ConnectorProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedConnector, setSelectedConnector] = useState<Connector | null>(null);

  return (
    <ConnectorContext.Provider value={{ selectedConnector, setSelectedConnector }}>
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
