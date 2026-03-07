import { Connector } from '../../connectors/types';
import { Button } from '@/src/ui-kit';
import { Loader2 } from 'lucide-react';

interface IngestDataViewProps {
  activeConnector: Connector | null;
  isImporting?: boolean;
  connectorResults?: any;
  onGoToDataSource: () => void;
}

export const IngestDataView = ({ activeConnector, isImporting, connectorResults, onGoToDataSource }: IngestDataViewProps) => {
  // Handle potential nested data property and inconsistent keys
  const data = connectorResults?.data || connectorResults;
  const summary = data?.summary;
  const tables = data?.tables || [];

  // Handle "data size mb" vs "data_size_mb"
  const dataSize = summary?.data_size_mb || summary?.['data size mb'] || 0;

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
      ) : isImporting || (!summary && tables.length === 0) ? (
        <div className="flex flex-col items-center justify-center py-12 gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-[var(--accent)]" />
          <div className="text-center">
            <p className="text-sm font-bold text-[var(--text-primary)]">Importing your data...</p>
            <p className="text-xs text-[var(--text-secondary)]">Mapping schemas and fetching table structures</p>
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)]">
              <div className="text-[10px] uppercase tracking-widest text-[var(--text-secondary)] mb-1">Total Rows</div>
              <div className="text-2xl font-bold font-mono">
                {summary?.total_rows?.toLocaleString() || '0'}
              </div>
            </div>
            <div className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)]">
              <div className="text-[10px] uppercase tracking-widest text-[var(--text-secondary)] mb-1">Total Columns</div>
              <div className="text-2xl font-bold font-mono">
                {summary?.total_columns?.toLocaleString() || '0'}
              </div>
            </div>
            <div className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)]">
              <div className="text-[10px] uppercase tracking-widest text-[var(--text-secondary)] mb-1">Data Size</div>
              <div className="text-2xl font-bold font-mono">
                {dataSize} MB
              </div>
            </div>
            <div className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)]">
              <div className="text-[10px] uppercase tracking-widest text-[var(--text-secondary)] mb-1">Last Sync</div>
              <div className="text-sm font-bold mt-2">{summary?.last_sync || 'Never'}</div>
            </div>
          </div>

          <div className="mt-6">
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-secondary)] mb-3">Tables</h4>
            <div className="space-y-2">
              {tables.length > 0 ? (
                tables.map((t, idx) => (
                  <div key={idx} className="flex justify-between items-center p-3 rounded-lg bg-[var(--surface)] border border-[var(--border)] hover:bg-[var(--surface-hover)] transition-colors">
                    <span className="font-mono text-sm">{t.table}</span>
                    <span className="text-xs text-[var(--text-secondary)]">{t.rows.toLocaleString()} rows • {t.columns} cols</span>
                  </div>
                ))
              ) : (
                <div className="p-4 text-center border border-dashed border-[var(--border)] rounded-lg text-sm text-[var(--text-secondary)]">
                  No tables detected yet
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
