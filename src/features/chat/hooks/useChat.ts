import { useState, useCallback, useRef, useEffect } from 'react';
import { Message } from '../types';

export type ChatMode = 'landing' | 'workflow' | 'chat';

export const useChat = (initialMode: ChatMode = 'landing', initialMessage?: string) => {
  const [mode, setMode] = useState<ChatMode>(initialMode);
  const [messages, setMessages] = useState<Message[]>(() => {
    if (initialMode !== 'chat') return [];
    
    const initMessages: Message[] = [
      {
        id: 'init-1',
        role: 'assistant',
        content: `Great! I've successfully connected to your data and synchronized the environment. How can I help you analyze this information today?`,
        timestamp: new Date(),
      }
    ];

    if (initialMessage) {
      initMessages.push({
        id: 'init-context',
        role: 'user',
        content: initialMessage,
        timestamp: new Date(),
      });
    }

    return initMessages;
  });
  const [isLoading, setIsLoading] = useState(false);
  const [processingSteps, setProcessingSteps] = useState<string[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, mode, processingSteps, scrollToBottom]);

  const startWorkflow = useCallback(() => {
    setMode('workflow');
  }, []);

  const startChat = useCallback(() => {
    setMode('chat');
    setMessages([
      {
        id: 'init-1',
        role: 'assistant',
        content: `Great! I've successfully connected to your data and synchronized the environment. How can I help you analyze this information today? For example, you can ask "Show me the average price by brand" or "List all products".`,
        timestamp: new Date(),
      },
    ]);
  }, []);

  const completeWorkflow = useCallback(() => {
    startChat();
  }, [startChat]);

  const sendMessage = useCallback(async (content: string) => {
    if (mode !== 'chat') return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);
    setProcessingSteps([]);

    // Simulate multi-step processing
    const steps = [
      'Analyzing query intent...',
      'Generating SQL query...',
      'Executing query on database...',
      'Formatting results and generating visualization...'
    ];

    for (let i = 0; i < steps.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 800));
      setProcessingSteps(prev => [...prev, steps[i]]);
    }

    await new Promise(resolve => setTimeout(resolve, 500));

    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: `Here is the analysis based on your query: "${content}".`,
      timestamp: new Date(),
      data: {
        type: 'chart_and_table',
        chartData: [
          { brand: 'Realme', avg_price: 75173 },
          { brand: 'Samsung', avg_price: 118821 },
          { brand: 'Oppo', avg_price: 54550 },
          { brand: 'Xiaomi', avg_price: 90395 },
          { brand: 'Vivo', avg_price: 18266 },
          { brand: 'Apple', avg_price: 65093 },
          { brand: 'Motorola', avg_price: 127754 }
        ],
        tableData: [
          { product_id: 'P1001', brand: 'Realme', price_inr: 102702 },
          { product_id: 'P1002', brand: 'Samsung', price_inr: 145126 },
          { product_id: 'P1003', brand: 'Oppo', price_inr: 117408 },
          { product_id: 'P1004', brand: 'Xiaomi', price_inr: 146797 },
          { product_id: 'P1005', brand: 'Xiaomi', price_inr: 82254 },
          { product_id: 'P1006', brand: 'Vivo', price_inr: 8807 },
          { product_id: 'P1007', brand: 'Xiaomi', price_inr: 96590 },
          { product_id: 'P1008', brand: 'Samsung', price_inr: 135182 },
          { product_id: 'P1009', brand: 'Realme', price_inr: 46509 },
          { product_id: 'P1010', brand: 'Apple', price_inr: 86434 },
          { product_id: 'P1011', brand: 'Oppo', price_inr: 10632 },
          { product_id: 'P1012', brand: 'Oppo', price_inr: 35611 },
          { product_id: 'P1013', brand: 'Xiaomi', price_inr: 34380 },
          { product_id: 'P1014', brand: 'Realme', price_inr: 76309 },
          { product_id: 'P1015', brand: 'Motorola', price_inr: 137431 },
          { product_id: 'P1016', brand: 'Samsung', price_inr: 76156 },
          { product_id: 'P1017', brand: 'Motorola', price_inr: 118078 },
          { product_id: 'P1018', brand: 'Apple', price_inr: 43753 },
          { product_id: 'P1019', brand: 'Xiaomi', price_inr: 148158 },
          { product_id: 'P1020', brand: 'Vivo', price_inr: 27726 }
        ]
      }
    };
    
    setMessages((prev) => [...prev, assistantMessage]);
    setIsLoading(false);
    setProcessingSteps([]);
  }, [mode]);

  return {
    messages,
    sendMessage,
    isLoading,
    processingSteps,
    scrollRef,
    mode,
    completeWorkflow,
    startChat,
    startWorkflow,
  };
};
