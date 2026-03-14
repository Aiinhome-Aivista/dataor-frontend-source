import React from 'react';
import { User } from 'lucide-react';
import { Button } from '../ui-kit';
import { AppHeaderProps } from '../types/layout';
import { useAuthContext } from '../context/AuthContext';

export const AppHeader: React.FC<AppHeaderProps> = ({ activeTab, selectedConnector }) => {
  const { userName } = useAuthContext();
  const getTabTitle = () => {
    switch (activeTab) {
      case 'chat': return 'Query';
      case 'new-connector': return 'Add Connector';
      case 'collection': return 'Import';
      case 'analysis': return 'Process';
      default: return 'Data source';
    }
  };

  const getTabSubtitle = () => {
    switch (activeTab) {
      case 'chat':
        return 'Ask anything to analyze your data and get insights';
      case 'new-connector':
        return `Set up connection for ${selectedConnector?.name || 'new server'} with DAgent Guide`;
      case 'collection':
        return 'Manage data ingestion and synchronization';
      case 'analysis':
        return 'Review statistical models and generated insights';
      default:
        return 'Connect your data directly to run instant analysis';
    }
  };

  return (
    <header className="h-14 border-b border-[var(--border)] bg-[var(--bg)]/80 backdrop-blur-md sticky top-0 z-40 px-6 flex items-center justify-between">
      <div>
        <h1 className="text-lg font-bold tracking-tight">
          {getTabTitle()}
        </h1>
        <p className="text-sm text-[var(--text-secondary)]">
          {getTabSubtitle()}
        </p>
      </div>
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" className="flex items-center gap-2.5 rounded-full pr-4 pl-1.5 h-9 border-[var(--border)] hover:bg-[var(--surface-hover)] transition-all">
          <div className="w-6 h-6 rounded-full bg-[var(--accent)]/10 flex items-center justify-center text-[var(--accent)]">
            <User className="w-4 h-4" />
          </div>
          <span className="text-sm font-medium">Welcome {userName || 'aiinhome'}</span>
        </Button>
      </div>
    </header>
  );
};
