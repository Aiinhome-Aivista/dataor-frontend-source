import { useState } from 'react';
import { Button, Input, Card, CardContent, CardHeader } from '@/src/ui-kit';
import { motion, AnimatePresence } from 'motion/react';
import { Server, Shield, Globe, Info, ChevronLeft, Sparkles, Loader2 } from 'lucide-react';
import { ThreeAvatar } from '../../chat/components/ThreeAvatar';
import { Connector } from '../types';
import { connectorService } from '@/src/services/connector.service';

interface FieldGuide {
  title: string;
  description: string;
  tip: string;
}

const GUIDES: Record<string, FieldGuide> = {
  name: {
    title: "Connection Name",
    description: "Give your connection a unique name to identify it later.",
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
  }
};

interface ConnectorFormProps {
  onBack: () => void;
  connector?: Connector | null;
  onTestSuccess?: (connectionName: string) => void;
}

export const ConnectorForm = ({ onBack, connector, onTestSuccess }: ConnectorFormProps) => {
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

  const handleFocus = (field: string) => setActiveField(field);
  const handleMouseEnter = (field: string) => setActiveField(field);

  const handleTestConnection = async () => {
    setIsTesting(true);
    // Simulate successful test
    setTimeout(async () => {
      setIsTesting(false);
      onTestSuccess?.(formData.name);
    }, 1500);
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
                <Server className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold">
                  {connector ? `Connect to ${connector.name}` : 'New Server Connection'}
                </h2>
                <p className="text-sm text-[var(--text-secondary)]">Configure your database connection settings</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div 
                onMouseEnter={() => handleMouseEnter('name')}
                className="md:col-span-2"
              >
                <Input 
                  label="Connection Name"
                  placeholder="e.g. Production Database"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  onFocus={() => handleFocus('name')}
                  required
                />
              </div>

              <div onMouseEnter={() => handleMouseEnter('host')}>
                <Input 
                  label="Host / IP Address"
                  placeholder="db.example.com"
                  value={formData.host}
                  onChange={(e) => setFormData({...formData, host: e.target.value})}
                  onFocus={() => handleFocus('host')}
                  required
                />
              </div>

              <div onMouseEnter={() => handleMouseEnter('port')}>
                <Input 
                  label="Port"
                  placeholder="5432"
                  value={formData.port}
                  onChange={(e) => setFormData({...formData, port: e.target.value})}
                  onFocus={() => handleFocus('port')}
                  required
                />
              </div>

              <div onMouseEnter={() => handleMouseEnter('database')}>
                <Input 
                  label="Database Name"
                  placeholder="main_db"
                  value={formData.database}
                  onChange={(e) => setFormData({...formData, database: e.target.value})}
                  onFocus={() => handleFocus('database')}
                  required
                />
              </div>

              <div onMouseEnter={() => handleMouseEnter('username')}>
                <Input 
                  label="Username"
                  placeholder="readonly_user"
                  value={formData.username}
                  onChange={(e) => setFormData({...formData, username: e.target.value})}
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
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  onFocus={() => handleFocus('password')}
                  required
                />
              </div>
            </div>

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
                ) : 'Test Connection'}
              </Button>
            </div>
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
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--accent)]">Dataor Guide</span>
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
                  Hover or click on a field to get guidance from Dataor.
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
              <h5 className="font-bold">Dataor Assistant</h5>
              <p className="text-[10px] text-[var(--text-secondary)] uppercase tracking-widest">Always here to help</p>
            </div>
          </div>
        </div>

        <div className="p-6 rounded-2xl border border-[var(--border)] bg-[var(--surface)]/30 space-y-4">
          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5 text-emerald-500" />
            <span className="text-sm font-medium">Secure Connection</span>
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
