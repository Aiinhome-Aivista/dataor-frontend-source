import React from 'react';
import {
  BarChart, Bar,
  PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer
} from 'recharts';
import { Download, Table as TableIcon, BarChart3, PieChart as PieIcon, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/src/ui-kit';
import { Visualization } from '../types';
import { toPng } from 'html-to-image';

interface ChatVisualizationProps {
  visualization: Visualization;
}

const COLORS = ['var(--accent)', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export const ChatVisualization: React.FC<ChatVisualizationProps> = ({ visualization }) => {
  const { type, data, title, columns, xKey = 'label', yKey = 'value' } = visualization;

  const resolveKeys = () => {
    if (!data || data.length === 0) return { x: xKey, y: yKey };
    const firstItem = data[0];
    const itemKeys = Object.keys(firstItem);
    
    let x = xKey;
    let y = yKey;
    
    // If xKey doesn't exist, try common field names or first key
    if (!(xKey in firstItem)) {
      x = itemKeys.find(k => ['category', 'label', 'name', 'brand', 'date', 'type', 'group', 'id'].includes(k.toLowerCase())) || itemKeys[0];
    }
    
    // If yKey doesn't exist, try common field names (preferring numbers)
    if (!(yKey in firstItem)) {
      y = itemKeys.find(k => k !== x && typeof firstItem[k] === 'number') 
          || itemKeys.find(k => k !== x && !isNaN(parseFloat(firstItem[k])))
          || itemKeys.find(k => k !== x && (['value', 'count', 'amount', 'price', 'total', 'quantity'].includes(k.toLowerCase()))) 
          || itemKeys.find(k => k !== x) 
          || itemKeys[1];
    }
    
    return { x, y };
  };

  const { x: resolvedXKey, y: resolvedYKey } = resolveKeys();

  const formatValue = (value: any) => {
    if (typeof value !== 'number') return value;
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
    return value.toString();
  };

  const chartRef = React.useRef<HTMLDivElement>(null);

  const handleDownloadPng = async () => {
    if (!chartRef.current) return;

    try {
      const dataUrl = await toPng(chartRef.current, { backgroundColor: 'var(--bg)' });
      const link = document.createElement('a');
      link.download = `${title || 'chart'}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Failed to download PNG:', err);
    }
  };

  const handleDownload = () => {
    if (!data || data.length === 0) return;

    const headers = columns ? columns.map(c => c.label) : Object.keys(data[0]);
    const keys = columns ? columns.map(c => c.key) : Object.keys(data[0]);

    const csvContent = "data:text/csv;charset=utf-8,"
      + headers.join(",") + "\n"
      + data.map(row => keys.map(key => `"${row[key] || ''}"`).join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${title || 'export'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderTable = () => {
    if (!data || data.length === 0) return null;
    const tableColumns = columns || Object.keys(data[0]).map(key => ({ key, label: key }));

    return (
      <div className="bg-[var(--bg)] rounded-xl border border-[var(--border)] overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-black/5">
        <div className="flex justify-between items-center p-3 border-b border-[var(--border)] bg-[var(--surface)]/50 backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <TableIcon className="w-3.5 h-3.5 text-[var(--accent)]" />
            <span className="text-xs font-bold uppercase tracking-widest text-[var(--text-secondary)]">{title || 'Data Table'}</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownload}
            className="h-8 w-8 p-0  text-xs flex items-center justify-center rounded-lg border-[var(--border)] hover:bg-[var(--accent)]/10 hover:text-[var(--accent)] hover:border-[var(--accent)]/30 transition-all"
            title="Download CSV"
          >
            <Download className="w-4 h-4" />
            Download
          </Button>
        </div>
        <div className="overflow-x-auto max-h-64 custom-scrollbar">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-[var(--surface)] sticky top-0 z-10">
              <tr>
                {tableColumns.map(col => (
                  <th key={col.key} className="px-4 py-2.5 font-bold text-[var(--text-secondary)] border-b border-[var(--border)] uppercase tracking-tighter shadow-sm">
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]/50">
              {data.map((row, i) => (
                <tr key={i} className="hover:bg-[var(--accent)]/5 transition-colors group">
                  {tableColumns.map(col => (
                    <td key={`${i}-${col.key}`} className="px-4 py-2.5 font-mono text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors">
                      {row[col.key]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderBarChart = () => (
    <div className="bg-[var(--bg)] rounded-xl border border-[var(--border)] p-4 transition-all duration-300 hover:shadow-lg hover:shadow-black/5">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-3.5 h-3.5 text-[var(--accent)]" />
          <span className="text-xs font-bold uppercase tracking-widest text-[var(--text-secondary)]">{title || 'Bar Chart'}</span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleDownloadPng}
          className="h-8 w-8 p-0  text-xs flex items-center justify-center rounded-lg border-[var(--border)] hover:bg-[var(--accent)]/10 hover:text-[var(--accent)] hover:border-[var(--accent)]/30 transition-all"
          title="Download PNG"
        >
          <Download className="w-4 h-4" />
          Download
        </Button>
      </div>
      <div className="h-64 w-full" ref={chartRef}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} opacity={0.5} />
            <XAxis
              dataKey={resolvedXKey}
              stroke="var(--text-secondary)"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              tick={{ fill: 'var(--text-secondary)' }}
              label={{ value: xKey, position: 'insideBottom', offset: -5, fill: 'var(--text-secondary)', fontSize: 10, fontWeight: 'bold' }}
            />
            <YAxis
              stroke="var(--text-secondary)"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              tick={{ fill: 'var(--text-secondary)' }}
              tickFormatter={formatValue}
              label={{ value: yKey, angle: -90, position: 'insideLeft', offset: 10, fill: 'var(--text-secondary)', fontSize: 10, fontWeight: 'bold' }}
            />
            <Tooltip
              cursor={{ fill: 'var(--accent)', opacity: 0.05 }}
              contentStyle={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)', borderRadius: '12px', fontSize: '12px', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
              itemStyle={{ color: 'var(--accent)', fontWeight: 'bold' }}
              labelStyle={{ color: 'var(--text-secondary)', marginBottom: '4px', fontWeight: 'bold' }}
              formatter={(value: any) => [typeof value === 'number' ? value.toLocaleString() : value, yKey]}
            />
            <Bar dataKey={resolvedYKey} fill="var(--accent)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );

  const renderPieChart = () => (
    <div className="bg-[var(--bg)] rounded-xl border border-[var(--border)] p-4 transition-all duration-300 hover:shadow-lg hover:shadow-black/5">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <PieIcon className="w-3.5 h-3.5 text-[var(--accent)]" />
          <span className="text-xs font-bold uppercase tracking-widest text-[var(--text-secondary)]">{title || 'Pie Chart'}</span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleDownloadPng}
          className="h-8 w-8 p-0 flex text-xs items-center justify-center rounded-lg border-[var(--border)] hover:bg-[var(--accent)]/10 hover:text-[var(--accent)] hover:border-[var(--accent)]/30 transition-all"
          title="Download PNG"
        >
          <Download className="w-4 h-4" />
          Download
        </Button>
      </div>
      <div className="h-64 w-full" ref={chartRef}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={5}
              dataKey={resolvedYKey}
              nameKey={resolvedXKey}
              label={({ value }) => `${value}`}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)', borderRadius: '12px', fontSize: '12px', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
              formatter={(value: any, name: any) => [typeof value === 'number' ? value.toLocaleString() : value, name]}
            />
            <Legend
              verticalAlign="bottom"
              height={36}
              iconType="circle"
              formatter={(value) => <span className="text-[10px] text-[var(--text-secondary)] font-bold">{value}</span>}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );

  switch (type) {
    case 'table': return renderTable();
    case 'bar_chart': return renderBarChart();
    case 'pie_chart': return renderPieChart();
    default: return null;
  }
};
