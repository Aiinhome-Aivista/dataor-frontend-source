import { useChat, ChatMode } from '../hooks/useChat';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { Card, CardContent, CardHeader, CardFooter, Badge, Button } from '@/src/ui-kit';
import { MessageSquare, Sparkles, MoreVertical, Database, Plus, ArrowRight, Loader2, ChevronDown, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useState, useEffect } from 'react';
import { connectorService } from '@/src/services/connector.service';
import { Connector } from '../../connectors/types';

interface ChatWindowProps {
  initialMode?: ChatMode;
  onNewConnector?: () => void;
  initialMessage?: string;
  suggestedQuestions?: string[];
}

export const ChatWindow = ({ 
  initialMode = 'landing', 
  onNewConnector, 
  initialMessage,
  suggestedQuestions = []
}: ChatWindowProps) => {
  const { messages, sendMessage, isLoading, processingSteps, scrollRef, mode, completeWorkflow, startChat } = useChat(initialMode, initialMessage);
  const [connectors, setConnectors] = useState<Connector[]>([]);
  const [isLoadingConnectors, setIsLoadingConnectors] = useState(true);

  useEffect(() => {
    if (mode === 'landing') {
      const fetchConnectors = async () => {
        try {
          setIsLoadingConnectors(true);
          const data = await connectorService.getConnectors();
          const connected = data.filter(c => c.status === 'connected');
          setConnectors(connected);
        } catch (err) {
          console.error(err);
        } finally {
          setIsLoadingConnectors(false);
        }
      };
      fetchConnectors();
    }
  }, [mode]);

  return (
    <Card className="flex flex-col h-full shadow-2xl shadow-black/20 border-[var(--border)] overflow-hidden bg-[var(--surface)]/30 backdrop-blur-xl">
      <CardHeader className="flex flex-row items-center justify-between py-3 px-6 bg-[var(--surface)]/80 backdrop-blur-md border-b border-[var(--border)] relative z-30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[var(--accent)]/10 flex items-center justify-center text-[var(--accent)] border border-[var(--accent)]/20 shadow-inner">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-black text-base tracking-tight">Dataor AI Assistant</h3>
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-[10px] text-[var(--text-secondary)] uppercase tracking-[0.2em] font-black">Active Session</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="px-3 py-1 font-mono text-[10px] border-[var(--accent)]/30 text-[var(--accent)]">AGENT_V2.4</Badge>
          <button className="p-2.5 rounded-xl hover:bg-[var(--surface-hover)] text-[var(--text-secondary)] transition-all hover:text-[var(--text-primary)]">
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>
      </CardHeader>

      <CardContent 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 scroll-smooth space-y-4 bg-[var(--bg)]/10 relative"
      >
        <AnimatePresence mode="wait">
          {mode === 'landing' ? (
            <motion.div
              key="landing"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex flex-col items-center justify-center h-full max-w-md mx-auto text-center space-y-8 py-8"
            >
              <div className="w-20 h-20 rounded-3xl bg-[var(--accent)]/10 flex items-center justify-center text-[var(--accent)] border border-[var(--accent)]/20">
                <Database className="w-10 h-10" />
              </div>
              <div>
                <h2 className="text-2xl font-bold mb-2">Welcome to Dataor AI</h2>
                <p className="text-[var(--text-secondary)]">To get started, select an existing data connector or set up a new one.</p>
              </div>
              
              <div className="w-full space-y-3 text-left">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-secondary)]">Available Connectors</h4>
                  <Badge variant="outline" className="text-[10px]">{connectors.length} Active</Badge>
                </div>
                
                {isLoadingConnectors ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-[var(--accent)]" />
                  </div>
                ) : (
                  connectors.map((conn) => (
                    <div key={conn.id} className="border border-[var(--border)] rounded-xl overflow-hidden bg-[var(--surface)]">
                      <Button
                        variant="ghost"
                        className="w-full justify-between h-auto py-4 px-6 rounded-none hover:bg-[var(--surface-hover)] transition-all"
                        onClick={startChat}
                      >
                        <div className="flex items-center gap-3">
                          <Database className="w-5 h-5 text-[var(--accent)]" />
                          <div className="flex flex-col items-start">
                            <span className="font-bold text-[var(--text-primary)]">{conn.name}</span>
                            <span className="text-[10px] text-[var(--text-secondary)] uppercase tracking-tighter">{conn.type}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            <span className="text-[10px] font-bold text-emerald-500 uppercase">Ready</span>
                          </div>
                          <ArrowRight className="w-4 h-4 text-[var(--text-secondary)]" />
                        </div>
                      </Button>
                    </div>
                  ))
                )}
                
                <Button 
                  className="w-full h-auto py-4 rounded-xl mt-6 bg-[var(--accent)] hover:bg-[var(--accent)]/90 text-white font-bold shadow-lg shadow-[var(--accent)]/20"
                  onClick={onNewConnector}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Connect New Data Source
                </Button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="chat"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-4"
            >
              {messages.map((msg) => (
                <ChatMessage key={msg.id} message={msg} />
              ))}
              
              {isLoading && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col mb-4"
                >
                  <div className="flex justify-start mb-2">
                    <div className="bg-[var(--surface)] border border-[var(--border)] px-4 py-3 rounded-2xl rounded-tl-none flex gap-1.5 items-center">
                      <span className="w-1.5 h-1.5 rounded-full bg-[var(--text-secondary)]/40 animate-bounce [animation-delay:-0.3s]" />
                      <span className="w-1.5 h-1.5 rounded-full bg-[var(--text-secondary)]/40 animate-bounce [animation-delay:-0.15s]" />
                      <span className="w-1.5 h-1.5 rounded-full bg-[var(--text-secondary)]/40 animate-bounce" />
                    </div>
                  </div>
                  {processingSteps.length > 0 && (
                    <div className="pl-4 border-l-2 border-[var(--border)] ml-4 mt-2 space-y-2">
                      {processingSteps.map((step, idx) => (
                        <motion.div 
                          key={idx}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="flex items-center gap-2 text-xs font-mono text-[var(--text-secondary)]"
                        >
                          {idx === processingSteps.length - 1 ? (
                            <Loader2 className="w-3 h-3 text-[var(--accent)] animate-spin" />
                          ) : (
                            <div className="w-3 h-3 rounded-full bg-emerald-500/20 flex items-center justify-center">
                              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            </div>
                          )}
                          {step}
                        </motion.div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>

      <CardFooter className="p-4 bg-[var(--surface)]/80 backdrop-blur-md border-t border-[var(--border)] relative z-30">
        <div className="w-full max-w-3xl mx-auto">
          {mode === 'chat' && messages.length <= 1 && suggestedQuestions.length > 0 && !isLoading && (
            <div className="flex flex-wrap gap-2 mb-4 justify-center">
              {suggestedQuestions.map((q, i) => (
                <motion.button
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  onClick={() => sendMessage(q)}
                  className="px-4 py-2 rounded-xl bg-[var(--accent)]/5 border border-[var(--accent)]/20 text-xs font-medium text-[var(--accent)] hover:bg-[var(--accent)]/10 hover:border-[var(--accent)]/40 transition-all shadow-sm flex items-center gap-2 group"
                >
                  <Sparkles className="w-3 h-3 group-hover:scale-110 transition-transform" />
                  {q}
                </motion.button>
              ))}
            </div>
          )}
          <ChatInput onSend={sendMessage} disabled={isLoading || mode !== 'chat'} />
          <div className="mt-3 flex items-center justify-center gap-4 text-[10px] text-[var(--text-secondary)]/60 uppercase tracking-[0.2em] font-black">
            <span className="flex items-center gap-1.5"><Sparkles className="w-3 h-3" /> Powered by Aiinhome Technologies</span>
            <span className="w-1 h-1 rounded-full bg-[var(--border)]" />
            <span>Secure Data Environment</span>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
};
