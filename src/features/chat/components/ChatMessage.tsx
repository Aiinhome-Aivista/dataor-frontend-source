import { Message } from '../types';
import { motion } from 'motion/react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Download } from 'lucide-react';
import { Button } from '@/src/ui-kit';

interface ChatMessageProps {
  message: Message;
  key?: string | number;
}

export const ChatMessage = ({ message }: ChatMessageProps) => {
  const isAssistant = message.role === 'assistant';

  const handleDownload = () => {
    if (!message.data?.tableData) return;
    
    const csvContent = "data:text/csv;charset=utf-8," 
      + Object.keys(message.data.tableData[0]).join(",") + "\n"
      + message.data.tableData.map((row: any) => Object.values(row).join(",")).join("\n");
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "data_export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className={`flex ${isAssistant ? 'justify-start' : 'justify-end'} mb-3`}
    >
      <div
        className={`
          max-w-[85%] px-3 py-2 rounded-xl text-sm leading-relaxed
          ${isAssistant 
            ? 'bg-[var(--surface)] border border-[var(--border)] text-[var(--text-primary)] rounded-tl-none' 
            : 'bg-[var(--accent)] text-white rounded-tr-none shadow-lg shadow-[var(--accent)]/10'}
        `}
      >
        <div className="mb-2">{message.content}</div>
        
        {message.data?.type === 'chart_and_table' && (
          <div className="mt-4 space-y-4">
            <div className="h-64 w-full bg-[var(--bg)] rounded-xl p-4 border border-[var(--border)]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={message.data.chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="brand" stroke="var(--text-secondary)" fontSize={12} />
                  <YAxis stroke="var(--text-secondary)" fontSize={12} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)', borderRadius: '8px' }}
                    itemStyle={{ color: 'var(--text-primary)' }}
                  />
                  <Bar dataKey="avg_price" fill="var(--accent)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            
            <div className="bg-[var(--bg)] rounded-xl border border-[var(--border)] overflow-hidden">
              <div className="flex justify-between items-center p-3 border-b border-[var(--border)] bg-[var(--surface)]">
                <span className="text-xs font-bold uppercase tracking-widest text-[var(--text-secondary)]">Data Table</span>
                <Button variant="outline" size="sm" onClick={handleDownload} className="h-7 text-xs">
                  <Download className="w-3 h-3 mr-1.5" />
                  Download CSV
                </Button>
              </div>
              <div className="overflow-x-auto max-h-48">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[var(--surface)]/50 sticky top-0">
                    <tr>
                      {Object.keys(message.data.tableData[0]).map(key => (
                        <th key={key} className="px-4 py-2 font-medium text-[var(--text-secondary)] border-b border-[var(--border)]">{key}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {message.data.tableData.map((row: any, i: number) => (
                      <tr key={i} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--surface)]/50">
                        {Object.values(row).map((val: any, j: number) => (
                          <td key={j} className="px-4 py-2 font-mono">{val}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        <div 
          className={`
            text-[10px] mt-2 opacity-50 
            ${isAssistant ? 'text-[var(--text-secondary)]' : 'text-white/80'}
          `}
        >
          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    </motion.div>
  );
};
