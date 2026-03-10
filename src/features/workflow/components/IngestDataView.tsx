import { Connector } from '../../connectors/types';
import { Button, Badge } from '@/src/ui-kit';
import { Loader2 } from 'lucide-react';

interface IngestDataViewProps {
  activeConnector: Connector | null;
  isImporting?: boolean;
  connectorResults?: any;
  onGoToDataSource: () => void;
  onContinue?: () => void;
}

export const IngestDataView = ({
  activeConnector,
  isImporting,
  connectorResults,
  onGoToDataSource,
  onContinue
}: IngestDataViewProps) => {
  // Handle potential nested results array - be very defensive
  const results = connectorResults?.results || (Array.isArray(connectorResults) ? connectorResults : []);

  // Handle potential nested data property and inconsistent keys for DB views
  const data = connectorResults?.data || connectorResults || {};
  const summary = data?.summary;
  const tables = data?.tables || [];
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
      ) : (() => {
        const isWebSearch = activeConnector.name === 'Web Search using LLM' || activeConnector.name === 'Web Search';

        if (isImporting ||
          (isWebSearch && !results.length && !connectorResults?.status) ||
          (!isWebSearch && !summary && tables.length === 0)) {
          return (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <Loader2 className="w-10 h-10 animate-spin text-[var(--accent)]" />
              <div className="text-center">
                <p className="text-sm font-bold text-[var(--text-primary)]">Importing your data...</p>
                <p className="text-xs text-[var(--text-secondary)]">
                  {isWebSearch ? 'Processing web search results and extracting data' : 'Mapping schemas and fetching table structures'}
                </p>
              </div>
            </div>
          );
        }

        if (isWebSearch) {
          return (
            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-[var(--text-secondary)]">Saved Sources</h4>
                  <Badge variant="outline" className="text-[10px]">{results.length} items</Badge>
                </div>

                <div className="grid gap-3">
                  {results.length > 0 ? (
                    results.map((item: any, idx: number) => (
                      <div key={item.search_id || item.saved_id || item.id || item.url || idx} className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)] hover:bg-[var(--surface-hover)] transition-colors group">
                        <div className="flex justify-between items-start mb-1">
                          <h5 className="text-sm font-bold group-hover:text-[var(--accent)] transition-colors line-clamp-1">{item.title}</h5>
                        </div>
                        <p className="text-xs text-[var(--text-secondary)] line-clamp-2">{item.brief}</p>
                      </div>
                    ))
                  ) : (
                    <div className="p-8 text-center border-2 border-dashed border-[var(--border)] rounded-2xl">
                      <p className="text-sm text-[var(--text-secondary)]">No saved results found for this research.</p>
                    </div>
                  )}
                </div>
              </div>

              {results.length > 0 && (
                <div className="flex justify-end pt-4 border-t border-[var(--border)]">
                  <Button
                    onClick={() => onContinue?.()}
                    className="bg-[var(--accent)] hover:bg-[var(--accent)]/90 text-white gap-2 px-6"
                  >
                    Continue to Process
                  </Button>
                </div>
              )}
            </div>
          );
        }

        return (
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
                  tables.map((t: any, idx: number) => (
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
        );
      })()}
    </div>
  );
};
