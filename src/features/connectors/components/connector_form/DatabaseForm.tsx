import { Input, Button } from '@/src/ui-kit';
import { Loader2 } from 'lucide-react';
import { ConnectorFormData } from '@/src/types/connector';

interface DatabaseFormProps {
  formData: ConnectorFormData;
  setFormData: (data: ConnectorFormData) => void;
  handleFocus: (field: string) => void;
  handleMouseEnter: (field: string) => void;
  handleTestConnection: () => void;
  isTesting: boolean;
  onBack: () => void;
}

export const DatabaseForm = ({
  formData,
  setFormData,
  handleFocus,
  handleMouseEnter,
  handleTestConnection,
  isTesting,
  onBack
}: DatabaseFormProps) => {
  return (
    <div className="space-y-6">
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
    </div>
  );
};
