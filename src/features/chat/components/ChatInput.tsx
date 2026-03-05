import { useState, FormEvent } from 'react';
import { Button, Input } from '@/src/ui-kit';
import { SendHorizontal } from 'lucide-react';

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
}

export const ChatInput = ({ onSend, disabled }: ChatInputProps) => {
  const [value, setValue] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (value.trim() && !disabled) {
      onSend(value.trim());
      setValue('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 items-center bg-[var(--surface)] p-1.5 rounded-xl border border-[var(--border)] shadow-inner focus-within:ring-2 focus-within:ring-[var(--accent)]/20 transition-all">
      <div className="flex-1">
        <Input
          placeholder="Ask anything about your data..."
          value={value}
          onChange={(e) => setValue(e.target.value)}
          disabled={disabled}
          className="border-none bg-transparent shadow-none focus-visible:ring-0 text-sm py-4 px-3"
        />
      </div>
      <Button 
        type="submit" 
        disabled={!value.trim() || disabled}
        className="h-10 w-10 rounded-lg p-0 shrink-0 bg-[var(--accent)] hover:bg-[var(--accent)]/90 text-white shadow-lg shadow-[var(--accent)]/20 transition-transform active:scale-95"
      >
        <SendHorizontal className="w-4 h-4" />
      </Button>
    </form>
  );
};
