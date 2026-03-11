import { useState } from 'react';
import { Button, Input, Card, CardContent, CardHeader } from '@/src/ui-kit';
import { motion, AnimatePresence } from 'motion/react';
import { Server, Shield, Globe, Info, ChevronLeft, Sparkles, Loader2, Search, Check, ListFilter } from 'lucide-react';
import { ThreeAvatar } from '../../chat/components/ThreeAvatar';
import { connectorService } from '@/src/services/connector.service';
import { useConnectorContext } from '../../../context/ConnectorContext';
import { useAuthContext } from '../../../context/AuthContext';

interface FieldGuide {
  title: string;
  description: string;
  tip: string;
}

const GUIDES: Record<string, FieldGuide> = {
  name: {
    title: "Data source Name",
    description: "Give your data source a unique name to identify it later.",
    tip: "Example: 'Production Postgres' or 'Marketing Data Warehouse'"
  },
  host: {
    title: "Server Host",
    description: "The IP address or domain name where your database is hosted.",
    tip: "If you're using a cloud provider, this is usually provided in their dashboard."
  },
  port: {
    title: "Port Number",
    description: "The communication port your database listens on.",
    tip: "Postgres usually uses 5432, MySQL uses 3306, and Snowflake uses 443."
  },
  database: {
    title: "Database Name",
    description: "The specific database you want to connect to within the server.",
    tip: "Make sure the user has permissions to access this specific database."
  },
  username: {
    title: "Username",
    description: "The database user account credentials.",
    tip: "We recommend using a read-only user for security best practices."
  },
  password: {
    title: "Password",
    description: "The password for the specified database user.",
    tip: "Your password is encrypted and stored securely using AES-256."
  },
  search: {
    title: "Web Search Query",
    description: "Enter keywords to search the live web for data and insights.",
    tip: "Use specific queries like 'Market trends for semiconductor industry 2024'"
  }
};

interface ConnectorFormProps {
  onBack: () => void;
  onTestSuccess?: (connectionName: string, shouldSwitchTab?: boolean) => void;
}

export const ConnectorForm = ({ onBack, onTestSuccess }: ConnectorFormProps) => {
  const { selectedConnector: connector, setSearchTopic } = useConnectorContext();
  const { userId } = useAuthContext();
  const [activeField, setActiveField] = useState<string | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [formData, setFormData] = useState({
    name: connector?.name || '',
    host: '',
    port: '',
    database: '',
    username: '',
    password: ''
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasResearched, setHasResearched] = useState(false);
  const [viewResults, setViewResults] = useState(false);
  const [selectedResultIds, setSelectedResultIds] = useState<Set<string>>(new Set());

  const [errorMsg, setErrorMsg] = useState('');

  const handleFocus = (field: string) => setActiveField(field);
  const handleMouseEnter = (field: string) => setActiveField(field);

  const handleTestConnection = async () => {
    setIsTesting(true);
    setErrorMsg('');
    try {
      const payload = {
        user_id: userId,
        session_id: localStorage.getItem('DAgent_session_id'),
        name: formData.name,
        type: connector?.name ? connector.name.toLowerCase() : 'mysql',
        host: formData.host,
        port: Number(formData.port),
        username: formData.username,
        password: formData.password,
        database: formData.database
      };

      const response: any = await connectorService.createConnector(payload);

      if (response.status === 'success') {
        onTestSuccess?.(formData.name);
      } else {
        const errorMsg = response.message;
        setErrorMsg(errorMsg || 'Connection failed. Please try again.');
      }
    } catch (error: any) {
      console.error('Connection Error:', error);
      setErrorMsg(error.message || 'An error occurred during connection.');
    } finally {
      setIsTesting(false);
    }
  };

  const handleWebSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    setHasResearched(false);
    setViewResults(false);
    setErrorMsg('');
    try {
      const response = await connectorService.searchWeb(searchQuery, localStorage.getItem('DAgent_session_id'));
      if (response.status === 'success') {
        setSearchResults(response.results);
        setHasResearched(true);
        setSearchTopic(searchQuery);

        // Store top-level search_id and topic from response
        if (response.search_id) {
          localStorage.setItem('last_search_id', response.search_id);
        }
        if (response.topic) {
          localStorage.setItem('last_search_topic', response.topic);
        }

        // Default select all - prioritize individual result identifiers
        const ids = response.results.map((r: any) => r.search_id || r.id || r.url);
        setSelectedResultIds(new Set(ids));

      } else {
        setErrorMsg('Search failed. Please try again.');
      }
    } catch (error: any) {
      console.error('Search Error:', error);
      setErrorMsg(error.message || 'An error occurred during search.');
    } finally {
      setIsSearching(false);
    }
  };

  const toggleSelectAll = () => {
    if (selectedResultIds.size === searchResults.length) {
      setSelectedResultIds(new Set());
    } else {
      setSelectedResultIds(new Set(searchResults.map(r => r.search_id || r.id || r.url)));
    }
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selectedResultIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedResultIds(next);
  };

  const handleImport = async () => {
    if (selectedResultIds.size > 0) {
      // Sync with backend on import
      const userId = localStorage.getItem('DAgent_user_id') || '1';
      const lastSearchId = localStorage.getItem('last_search_id') || '';
      const lastSearchTopic = localStorage.getItem('last_search_topic') || searchQuery;
      const selectedResults = searchResults.filter(r => selectedResultIds.has(r.id || r.url));

      try {
        await Promise.all(selectedResults.map(result =>
          connectorService.saveResult({
            user_id: userId,
            session_id: localStorage.getItem('DAgent_session_id') || '',
            search_id: lastSearchId,
            topic: lastSearchTopic,
            brief: result.brief,
            title: result.title,
            url: result.url
          })
        ));

        onTestSuccess?.(connector?.name || formData.name || 'Web Search Context', false);
      } catch (err) {
        console.error('Failed to save results:', err);
        setErrorMsg('Failed to save selected results. Please try again.');
      }
    }
  };

  const isWebSearch = connector?.name === 'Web Search using LLM';

  const guide = activeField ? GUIDES[activeField] : null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
      <div className="lg:col-span-2 space-y-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors mb-4 group"
        >
          <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back to Connectors
        </button>

        <Card className="border-[var(--border)] shadow-xl">
          <CardHeader className="border-b border-[var(--border)] p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-[var(--accent)]/10 flex items-center justify-center text-[var(--accent)]">
                {isWebSearch ? (
                  <div className="relative">
                    <Globe className="w-6 h-6" />
                    <Search className="w-3.5 h-3.5 absolute -bottom-1 -right-1" />
                  </div>
                ) : (
                  <Server className="w-6 h-6" />
                )}
              </div>
              <div>
                <h2 className="text-xl font-bold">
                  {connector ? `Connect to ${connector.name}` : 'New Data source'}
                </h2>
                <p className="text-sm text-[var(--text-secondary)]">
                  {isWebSearch ? 'Identify live data for AI analysis' : 'Configure your data source settings'}
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-8 space-y-6">
            {errorMsg && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs font-medium text-center">
                {errorMsg}
              </div>
            )}
            <div className="space-y-6">
              <div
                onMouseEnter={() => handleMouseEnter('name')}
              >
                <Input
                  label="Data source Name"
                  placeholder="e.g. Production Database"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  onFocus={() => handleFocus('name')}
                  required
                />
              </div>

              {isWebSearch ? (
                <div className="space-y-6">
                  <div onMouseEnter={() => handleMouseEnter('search')}>
                    <div className="flex gap-2 items-end">
                      <div className="flex-1">
                        <Input
                          label="search"
                          placeholder="e.g. Latest stock market trends"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          onFocus={() => handleFocus('search')}
                        />
                      </div>
                      <Button
                        onClick={handleWebSearch}
                        disabled={isSearching}
                        className="px-6 h-11"
                      >
                        <Search className="w-4 h-4 mr-2" />
                        Search
                      </Button>
                    </div>
                  </div>

                  <AnimatePresence mode="wait">
                    {isSearching && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="p-6 rounded-2xl border border-[var(--border)] bg-[var(--accent)]/5 flex items-center gap-4"
                      >
                        <div className="relative">
                          <div className="w-10 h-10 rounded-full border-2 border-[var(--accent)]/20 flex items-center justify-center">
                            <Loader2 className="w-5 h-5 text-[var(--accent)] animate-spin" />
                          </div>
                          <div className="absolute inset-0 rounded-full border-2 border-[var(--accent)] animate-ping opacity-20" />
                        </div>
                        <div>
                          <h4 className="font-bold text-sm">Researching Websites...</h4>
                          <p className="text-xs text-[var(--text-secondary)]">Analyzing live web data and extracting insights</p>
                        </div>
                      </motion.div>
                    )}

                    {hasResearched && !isSearching && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-4"
                      >
                        {!viewResults && (
                          <div className="flex items-center gap-2 text-[var(--accent)] text-xs font-bold mb-2">
                            <Check className="w-3.5 h-3.5" />
                            Fast Research completed!
                          </div>
                        )}

                        <div className="space-y-4">
                          <div className="grid gap-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                            {(viewResults ? searchResults : searchResults.slice(0, 3)).map((result) => {
                              const resultId = result.id || result.url;
                              return (
                                <div
                                  key={resultId}
                                  onClick={() => toggleSelect(resultId)}
                                  className={`
                                    p-4 rounded-xl border transition-all cursor-pointer group flex items-start gap-4
                                    ${selectedResultIds.has(resultId)
                                      ? 'border-[var(--accent)] bg-[var(--accent)]/5'
                                      : 'border-[var(--border)] bg-[var(--surface-hover)]/30 hover:border-[var(--accent)]/40'}
                                  `}
                                >
                                  <div className="flex-1">
                                    <div className="flex justify-between items-start mb-1">
                                      <h4 className="font-bold text-sm text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors">
                                        {result.title}
                                      </h4>
                                    </div>
                                    <p className="text-xs text-[var(--text-secondary)] line-clamp-2 leading-relaxed mb-2">
                                      {result.brief}
                                    </p>
                                    <a
                                      href={result.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      onClick={(e) => e.stopPropagation()}
                                      className="text-[10px] text-[var(--accent)] hover:underline flex items-center gap-1"
                                    >
                                      {result.url}
                                    </a>
                                  </div>
                                  <div className="pt-1">
                                    <input
                                      type="checkbox"
                                      checked={selectedResultIds.has(resultId)}
                                      onChange={() => { }} // Controlled via parent div click
                                      className="w-4 h-4 rounded border-[var(--border)] accent-[var(--accent)] cursor-pointer"
                                    />
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          {!viewResults && searchResults.length > 3 && (
                            <div className="flex items-center justify-between pt-2">
                              <div className="flex items-center gap-2">
                                <div className="flex -space-x-2">
                                  <div className="w-3 h-3 rounded-full bg-[var(--accent)] border border-white" />
                                  <div className="w-3 h-3 rounded-full bg-[var(--accent)]/60 border border-white" />
                                </div>
                                <button
                                  onClick={() => setViewResults(true)}
                                  className="text-xs font-bold text-[var(--accent)] hover:underline flex items-center gap-1"
                                >
                                  {searchResults.length - 3} more sources
                                  <span className="text-[var(--text-secondary)] font-medium">View</span>
                                </button>
                              </div>
                            </div>
                          )}

                          <div className="flex items-center justify-between pt-4 border-t border-[var(--border)]">
                            <p className="text-xs font-medium text-[var(--text-secondary)]">
                              {selectedResultIds.size} sources selected
                            </p>
                            <div className="flex gap-3">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => { setViewResults(false); setHasResearched(false); }}
                              >
                                Delete
                              </Button>
                              <Button
                                size="sm"
                                disabled={selectedResultIds.size === 0}
                                onClick={handleImport}
                                className="px-6 rounded-full"
                              >
                                Import
                              </Button>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div onMouseEnter={() => handleMouseEnter('host')}>
                    <Input
                      label="Host / IP Address"
                      placeholder="db.example.com"
                      value={formData.host}
                      onChange={(e) => setFormData({ ...formData, host: e.target.value })}
                      onFocus={() => handleFocus('host')}
                      required
                    />
                  </div>

                  <div onMouseEnter={() => handleMouseEnter('port')}>
                    <Input
                      label="Port"
                      placeholder="5432"
                      value={formData.port}
                      onChange={(e) => setFormData({ ...formData, port: e.target.value })}
                      onFocus={() => handleFocus('port')}
                      required
                    />
                  </div>

                  <div onMouseEnter={() => handleMouseEnter('database')}>
                    <Input
                      label="Database Name"
                      placeholder="main_db"
                      value={formData.database}
                      onChange={(e) => setFormData({ ...formData, database: e.target.value })}
                      onFocus={() => handleFocus('database')}
                      required
                    />
                  </div>

                  <div onMouseEnter={() => handleMouseEnter('username')}>
                    <Input
                      label="Username"
                      placeholder="readonly_user"
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      onFocus={() => handleFocus('username')}
                      required
                    />
                  </div>

                  <div
                    onMouseEnter={() => handleMouseEnter('password')}
                    className="md:col-span-2"
                  >
                    <Input
                      label="Password"
                      type="password"
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      onFocus={() => handleFocus('password')}
                      required
                    />
                  </div>
                </div>
              )}
            </div>

            {!isWebSearch && (
              <div className="pt-6 flex justify-end gap-4">
                <Button variant="outline" onClick={onBack} disabled={isTesting}>Cancel</Button>
                <Button
                  className="px-8"
                  onClick={handleTestConnection}
                  disabled={isTesting}
                >
                  {isTesting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Testing...
                    </>
                  ) : 'Connect to Data source'}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Avatar Guide */}
      <div className="lg:sticky lg:top-28 space-y-6">
        <div className="relative">
          <AnimatePresence mode="wait">
            {guide ? (
              <motion.div
                key={activeField}
                initial={{ opacity: 0, y: 20, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.9 }}
                className="relative z-10"
              >
                <div className="bg-[var(--surface)] border border-[var(--border)] p-6 rounded-3xl shadow-2xl relative">
                  {/* Speech Bubble Arrow */}
                  <div className="absolute -left-2 top-10 w-4 h-4 bg-[var(--surface)] border-l border-b border-[var(--border)] rotate-45 hidden lg:block" />

                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="w-4 h-4 text-[var(--accent)]" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--accent)]">DAgent Guide</span>
                  </div>

                  <h4 className="font-bold text-lg mb-2">{guide.title}</h4>
                  <p className="text-sm text-[var(--text-secondary)] mb-4 leading-relaxed">
                    {guide.description}
                  </p>

                  <div className="p-3 rounded-xl bg-[var(--accent)]/5 border border-[var(--accent)]/10">
                    <div className="flex items-start gap-2">
                      <Info className="w-4 h-4 text-[var(--accent)] shrink-0 mt-0.5" />
                      <p className="text-xs italic text-[var(--text-primary)]/80">
                        {guide.tip}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-[var(--surface)] border border-[var(--border)] p-6 rounded-3xl text-center"
              >
                <p className="text-sm text-[var(--text-secondary)]">
                  Hover or click on a field to get guidance from DAgent.
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="mt-8 flex flex-col items-center">
            <div className="relative">
              <ThreeAvatar />
              <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-emerald-500 border-4 border-[var(--bg)] flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-white animate-ping" />
              </div>
            </div>
            <div className="mt-4 text-center">
              <h5 className="font-bold">DAgent Assistant</h5>
              <p className="text-[10px] text-[var(--text-secondary)] uppercase tracking-widest">Always here to help</p>
            </div>
          </div>
        </div>

        <div className="p-6 rounded-2xl border border-[var(--border)] bg-[var(--surface)]/30 space-y-4">
          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5 text-emerald-500" />
            <span className="text-sm font-medium">Secure Data source</span>
          </div>
          <div className="flex items-center gap-3">
            <Globe className="w-5 h-5 text-blue-500" />
            <span className="text-sm font-medium">SSL/TLS Encryption</span>
          </div>
        </div>
      </div>
    </div>
  );
};
