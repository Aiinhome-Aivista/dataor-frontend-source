import { Connector } from '../../connectors/types';
import { Button } from '@/src/ui-kit';

interface IngestDataViewProps {
  activeConnector: Connector | null;
  onGoToDataSource: () => void;
}

export const IngestDataView = ({ activeConnector, onGoToDataSource }: IngestDataViewProps) => {
  return (
    <div className="mb-8 p-6 rounded-2xl border border-[var(--border)] bg-[var(--bg)]/50">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--text-secondary)]">
          {activeConnector ? `${activeConnector.name} Details` : 'Database Details'}
        </h3>
        {activeConnector && (
          <div className="flex items-center gap-2 px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-[10px] font-bold uppercase tracking-widest border border-emerald-500/20">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Connected
          </div>
        )}
      </div>

      {!activeConnector ? (
        <div className="text-center py-6">
          <p className="text-sm text-[var(--text-secondary)]">No active data source. Please connect a data source first.</p>
          <Button variant="outline" size="sm" className="mt-4" onClick={onGoToDataSource}>
            Go to Data source
          </Button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)]">
              <div className="text-[10px] uppercase tracking-widest text-[var(--text-secondary)] mb-1">Total Rows</div>
              <div className="text-2xl font-bold font-mono">50,000</div>
            </div>
            <div className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)]">
              <div className="text-[10px] uppercase tracking-widest text-[var(--text-secondary)] mb-1">Total Columns</div>
              <div className="text-2xl font-bold font-mono">24</div>
            </div>
            <div className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)]">
              <div className="text-[10px] uppercase tracking-widest text-[var(--text-secondary)] mb-1">Data Size</div>
              <div className="text-2xl font-bold font-mono">12.4 MB</div>
            </div>
            <div className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)]">
              <div className="text-[10px] uppercase tracking-widest text-[var(--text-secondary)] mb-1">Last Sync</div>
              <div className="text-sm font-bold mt-2">Just now</div>
            </div>
          </div>

          <div className="mt-6">
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-secondary)] mb-3">Tables</h4>
            <div className="space-y-2">
              <div className="flex justify-between items-center p-3 rounded-lg bg-[var(--surface)] border border-[var(--border)]">
                <span className="font-mono text-sm">public.users</span>
                <span className="text-xs text-[var(--text-secondary)]">50,000 rows • 12 cols</span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-lg bg-[var(--surface)] border border-[var(--border)]">
                <span className="font-mono text-sm">public.transactions</span>
                <span className="text-xs text-[var(--text-secondary)]">124,500 rows • 8 cols</span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-lg bg-[var(--surface)] border border-[var(--border)]">
                <span className="font-mono text-sm">public.products</span>
                <span className="text-xs text-[var(--text-secondary)]">1,200 rows • 4 cols</span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
