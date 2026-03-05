import { Connector } from '../types';
import { Card, CardContent, Badge, Button } from '@/src/ui-kit';
import { Database, Server, Share2, ArrowUpRight } from 'lucide-react';

interface ConnectorCardProps {
  connector: Connector;
  key?: string | number;
  onClick?: (connector: Connector) => void;
}

export const ConnectorCard = ({ connector, onClick }: ConnectorCardProps) => {
  const Icon = connector.type === 'Database' ? Database : 
               connector.type === 'Data Warehouse' ? Server : Share2;

  return (
    <Card 
      hoverable 
      className="group cursor-pointer" 
      onClick={() => onClick?.(connector)}
    >
      <CardContent className="flex flex-col h-full p-4">
        <div className="flex justify-between items-start mb-3">
          <div className="p-2 rounded-lg bg-[var(--surface-hover)] border border-[var(--border)] group-hover:border-[var(--accent)]/50 transition-colors">
            <Icon className="w-5 h-5 text-[var(--accent)]" />
          </div>
          <Badge variant={connector.status === 'connected' ? 'success' : 'secondary'} className="text-[10px] py-0 px-1.5">
            {connector.status}
          </Badge>
        </div>
        
        <div className="flex-1">
          <h3 className="text-base font-bold mb-1 group-hover:text-[var(--accent)] transition-colors">
            {connector.name}
          </h3>
          <p className="text-xs text-[var(--text-secondary)] line-clamp-2">
            {connector.description}
          </p>
        </div>

        <div className="mt-4 pt-3 border-t border-[var(--border)] flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-secondary)]/60">
            {connector.type}
          </span>
          <Button variant="ghost" size="sm" className="group/btn h-8 text-xs">
            Connect <ArrowUpRight className="w-3 h-3 ml-1 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
