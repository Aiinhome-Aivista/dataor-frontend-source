import { Connector } from '../types';
import { ConnectorCard } from './ConnectorCard';
import { Input } from '@/src/ui-kit';
import { Search, Filter, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { connectorService } from '@/src/services/connector.service';

interface ConnectorListProps {
  onSelect?: (connector: Connector) => void;
}

export const ConnectorList = ({ onSelect }: ConnectorListProps) => {
  const [search, setSearch] = useState('');
  const [connectors, setConnectors] = useState<Connector[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchConnectors = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await connectorService.getConnectors();
        setConnectors(data);
      } catch (err) {
        setError('Failed to load connectors. Please try again.');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchConnectors();
  }, []);

  const filtered = connectors.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.type.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row gap-4 items-end justify-between">
        <div className="w-full md:max-w-md">
          <Input 
            label="Search Connectors"
            placeholder="Search by name or type..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
          <div className="relative -top-8 left-3 w-4 h-4 text-[var(--text-secondary)]">
            <Search className="w-4 h-4" />
          </div>
        </div>
        
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-sm font-medium hover:bg-[var(--surface-hover)] transition-colors">
            <Filter className="w-4 h-4" />
            Filter
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-[var(--accent)]" />
        </div>
      ) : error ? (
        <div className="text-center py-20 border-2 border-dashed border-red-200 rounded-2xl bg-red-50">
          <p className="text-red-500">{error}</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((connector) => (
              <ConnectorCard 
                key={connector.id} 
                connector={connector} 
                onClick={onSelect}
              />
            ))}
          </div>

          {filtered.length === 0 && (
            <div className="text-center py-20 border-2 border-dashed border-[var(--border)] rounded-2xl">
              <p className="text-[var(--text-secondary)]">No connectors found matching your search.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
};
