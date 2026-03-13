import { useState, useRef, useEffect  } from 'react';
import { Card, CardContent, CardHeader, Input, Button } from '@/src/ui-kit';
import { Server, Globe, ChevronLeft, Search, FileSpreadsheet, FileCode2 } from 'lucide-react';
import { connectorService } from '@/src/services/connector.service';
import { useConnectorContext } from '../../../context/ConnectorContext';
import { useAuthContext } from '../../../context/AuthContext';


// Import Child Components
import { WebSearchForm } from './connector_form/WebSearchForm';
import { FileUploadForm } from './connector_form/FileUploadForm';
import { DatabaseForm } from './connector_form/DatabaseForm';
import { DAgentAssistant } from './connector_form/DAgentAssistant';
import { FieldGuide } from '@/src/types/connector';

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

  // File upload state from Context
  const { 
    uploadedFiles, setUploadedFiles, 
    isUploading, setIsUploading, 
    uploadProgress, setUploadProgress,
    handleFileUploadConnect: handleContextUpload,
    resetConnectorState
  } = useConnectorContext();

  const [isDragging, setIsDragging] = useState(false);

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

        if (response.search_id) {
          localStorage.setItem('last_search_id', response.search_id);
        }
        if (response.topic) {
          localStorage.setItem('last_search_topic', response.topic);
        }

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

  const toggleSelect = (id: string) => {
    const next = new Set(selectedResultIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedResultIds(next);
  };

  const handleImport = async () => {
    if (selectedResultIds.size > 0) {
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
  const isCsvUpload = connector?.name === 'Upload CSV File';
  const isSqlUpload = connector?.name === 'Upload SQL File';
  const isFileUpload = isCsvUpload || isSqlUpload;

  const acceptedFileTypes = isCsvUpload ? '.csv' : isSqlUpload ? '.sql' : '';

  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files).filter(f =>
      isCsvUpload ? f.name.endsWith('.csv') : f.name.endsWith('.sql')
    );
    if (files.length === 0) {
      setErrorMsg(`Only ${isCsvUpload ? 'CSV' : 'SQL'} files are allowed.`);
      return;
    }
    setErrorMsg('');
    setUploadedFiles(prev => [...prev, ...files]);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setErrorMsg('');
    setUploadedFiles(prev => [...prev, ...files]);
    e.target.value = '';
  };

  const removeFile = (idx: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== idx));
  };

  const handleFileUploadConnect = async () => {
    if (!userId || !localStorage.getItem("DAgent_session_id")) {
      setErrorMsg('Authentication error. Please log in again.');
      return;
    }
    setErrorMsg('');
    try {
      await handleContextUpload(userId as number);
      const connName = connector?.name || 'File Upload';
      // Wait a moment so user can see completion
      setTimeout(() => {
        resetConnectorState();
        onTestSuccess?.(connName, false);
      }, 1000);
    } catch (err: any) {
      console.error('Upload Error:', err);
      setErrorMsg(err.message || 'An error occurred during upload.');
      // After a short delay, go back even on failure as requested
      setTimeout(() => {
        resetConnectorState();
        onBack();
      }, 2000);
    }
  };


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
                ) : isCsvUpload ? (
                  <FileSpreadsheet className="w-6 h-6" />
                ) : isSqlUpload ? (
                  <FileCode2 className="w-6 h-6" />
                ) : (
                  <Server className="w-6 h-6" />
                )}
              </div>
              <div>
                <h2 className="text-xl font-bold">
                  {connector ? `Connect to ${connector.name}` : 'New Data source'}
                </h2>
                <p className="text-sm text-[var(--text-secondary)]">
                  {isWebSearch ? 'Identify live data for AI analysis' : isFileUpload ? `Upload ${isCsvUpload ? 'CSV' : 'SQL'} files for AI analysis` : 'Configure your data source settings'}
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

            {!isFileUpload && (
              <div onMouseEnter={() => handleMouseEnter('name')} className="mb-6">
                <Input
                  label="Data source Name"
                  placeholder="e.g. Production Postgres"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  onFocus={() => handleFocus('name')}
                  required
                />
              </div>
            )}
            
            {isWebSearch ? (
              <WebSearchForm 
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                handleFocus={handleFocus}
                handleMouseEnter={handleMouseEnter}
                handleWebSearch={handleWebSearch}
                isSearching={isSearching}
                hasResearched={hasResearched}
                viewResults={viewResults}
                setViewResults={setViewResults}
                setHasResearched={setHasResearched}
                searchResults={searchResults}
                selectedResultIds={selectedResultIds}
                toggleSelect={toggleSelect}
                handleImport={handleImport}
              />
            ) : isFileUpload ? (
              <FileUploadForm 
                isCsvUpload={isCsvUpload}
                isDragging={isDragging}
                setIsDragging={setIsDragging}
                handleFileDrop={handleFileDrop}
                handleFileInput={handleFileInput}
                acceptedFileTypes={acceptedFileTypes}
                uploadedFiles={uploadedFiles}
                setUploadedFiles={setUploadedFiles}
                removeFile={removeFile}
                uploadProgress={uploadProgress} 
                handleFileUploadConnect={handleFileUploadConnect}
                isUploading={isUploading}
                onBack={onBack}
              />
            ) : (
              <DatabaseForm 
                formData={formData}
                setFormData={setFormData}
                handleFocus={handleFocus}
                handleMouseEnter={handleMouseEnter}
                handleTestConnection={handleTestConnection}
                isTesting={isTesting}
                onBack={onBack}
              />
            )}
          </CardContent>
        </Card>
      </div>

      <DAgentAssistant guide={guide} activeField={activeField} />
    </div>
  );
};
