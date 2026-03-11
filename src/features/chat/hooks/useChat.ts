import { useState, useCallback, useRef, useEffect } from 'react';
import { Message } from '../types';
import { connectorService } from '@/src/services/connector.service';

export type ChatMode = 'landing' | 'workflow' | 'chat';

export const useChat = (initialMode: ChatMode = 'landing', initialMessage?: string, sessionId?: string) => {
  const [mode, setMode] = useState<ChatMode>(initialMode);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [processingSteps, setProcessingSteps] = useState<string[]>([]);
  const [followUpQuestions, setFollowUpQuestions] = useState<string[]>([]);
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
        content: `Great! I've successfully connected to your data and synchronized the environment. How can I help you analyze this information today?`,
        timestamp: new Date(),
      },
    ]);
  }, []);

  const completeWorkflow = useCallback(() => {
    startChat();
  }, [startChat]);

  const sendMessage = useCallback(async (content: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);
    setFollowUpQuestions([]);
    setProcessingSteps(['Analyzing query...']);

    try {
      const chatSessionId = sessionId
        || localStorage.getItem('DAgent_session_id')

      const response: any = await connectorService.sendSessionChat({
        session_id: chatSessionId,
        question: content
      });

    /*   console.log('Session Chat Response:', response); */

      const answerText = response?.answer || 'No answer received.';
      const followUps: string[] = response?.follow_up_questions || response?.suggested_questions || [];

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: answerText,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setFollowUpQuestions(followUps);
    } catch (error) {
      console.error('Session Chat Error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, something went wrong while processing your request.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setProcessingSteps([]);
    }
  }, [sessionId]);

  const fetchSuggestedQuestions = useCallback(async () => {
    try {
      const chatSessionId = sessionId || localStorage.getItem('DAgent_session_id');
      if (!chatSessionId) return;

      const response: any = await connectorService.sendSessionChat({
        session_id: chatSessionId,
        question: ""
      });

      const followUps: string[] = response?.follow_up_questions || response?.suggested_questions || [];
      setFollowUpQuestions(followUps);
    } catch (error) {
      console.error('Failed to fetch suggested questions:', error);
    }
  }, [sessionId]);

  useEffect(() => {
    if (mode === 'chat' && messages.length <= 1) {
      fetchSuggestedQuestions();
    }
  }, [mode, messages.length, fetchSuggestedQuestions]);

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
    followUpQuestions,
    fetchSuggestedQuestions
  };
};
