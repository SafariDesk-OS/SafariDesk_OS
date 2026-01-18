import React, { useMemo, useState, useEffect, useRef } from 'react';
import { MessageSquare, ChevronDown, Sparkles, BookOpen } from 'lucide-react';
import axios from 'axios';
import { useChatbotSocket } from '../../hooks/useChatbotSocket';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import ChatContactPrompt from './ChatContactPrompt';
import { APIS } from '../../services/apis';
import { KBArticle } from '../../types/knowledge';

type Props = {
  mode?: 'customer' | 'staff';
  token?: string | null;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

interface PublicConfig {
  greeting_message?: string;
  is_enabled: boolean;
  tone?: string;
}

const ChatbotWidget: React.FC<Props> = ({ mode = 'customer', token, open, onOpenChange }) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const [view, setView] = useState<'welcome' | 'chat'>('welcome');
  const [config, setConfig] = useState<PublicConfig | null>(null);
  const [kbSuggestions, setKbSuggestions] = useState<KBArticle[]>([]);
  const [kbLoading, setKbLoading] = useState(false);
  const [contactDraft, setContactDraft] = useState<{ name?: string; email?: string; phone?: string }>({});
  const lastKbQueryRef = useRef('');

  // NOTE: socket connection starts immediately when hook is called. 
  // Optimization: We could delay hook initialization until view === 'chat' to save connections,
  // but keeping it active allows background connectivity/typing.
  const { connected, typing, error, messages, contactRequest, sendMessage, sendContactInfo } = useChatbotSocket({ mode, token });

  useEffect(() => {
    axios.get(APIS.AI_CONFIG_VIEW)
      .then(res => setConfig(res.data))
      .catch(err => console.error("Failed to load chatbot config", err));
  }, []);

  useEffect(() => {
    if (contactRequest) {
      setKbSuggestions([]);
      setKbLoading(false);
    }
  }, [contactRequest]);

  const isOpen = open !== undefined ? open : internalOpen;

  const setOpenState = (value: boolean) => {
    if (onOpenChange) onOpenChange(value);
    if (open === undefined) {
      setInternalOpen(value);
    }
  };

  const statusText = useMemo(() => {
    if (error) return 'Error';
    return connected ? 'Online' : 'Offline';
  }, [connected, error]);

  const handleStartChat = () => {
    setView('chat');
  };

  const fetchKBSuggestions = async (query: string) => {
    const trimmed = query.trim();
    if (trimmed.length < 6) {
      setKbSuggestions([]);
      setKbLoading(false);
      return;
    }
    if (trimmed === lastKbQueryRef.current) {
      return;
    }
    lastKbQueryRef.current = trimmed;
    setKbLoading(true);
    try {
      const response = await axios.get(APIS.PUBLIC_KB_SEARCH, {
        params: { q: trimmed, page_size: 3 },
      });
      const results = Array.isArray(response.data?.results)
        ? response.data.results
        : Array.isArray(response.data)
        ? response.data
        : [];
      setKbSuggestions(results);
    } catch (error) {
      console.error("Failed to load KB suggestions", error);
      setKbSuggestions([]);
    } finally {
      setKbLoading(false);
    }
  };

  const handleSendMessage = (text: string, options?: { skipKb?: boolean }) => {
    sendMessage(text);
    if (options?.skipKb) {
      setKbSuggestions([]);
      setKbLoading(false);
      return;
    }
    setKbSuggestions([]);
    void fetchKBSuggestions(text);
  };

  const handleKbFeedback = (resolved: boolean) => {
    setKbSuggestions([]);
    setKbLoading(false);
    if (resolved) {
      handleSendMessage("Yes, that solved it. Thanks!", { skipKb: true });
    } else {
      handleSendMessage("No, that didn't help. I'd like to create a ticket.", { skipKb: true });
    }
  };

  return (
    <>
      {/* Floating button */}
      {!isOpen && (
        <button
          className="fixed bottom-6 right-6 bg-green-600 hover:bg-green-700 text-white rounded-full p-4 shadow-lg transition-transform hover:scale-105"
          onClick={() => setOpenState(true)}
          aria-label="Open chat"
        >
          <div className="relative">
            <MessageSquare className="w-6 h-6" />
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
            </span>
          </div>
        </button>
      )}

      {/* Chat window - Google Chrome Help Style */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-[400px] h-[600px] max-w-[95vw] max-h-[85vh] bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden font-sans transition-all duration-300 ease-in-out transform origin-bottom-right">

          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-2">
              <div className="bg-green-100 p-1.5 rounded-full dark:bg-green-900/30">
                <Sparkles className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="text-base font-semibold text-gray-900 dark:text-gray-100">Help guide</span>
                  <span className="px-1.5 py-0.5 text-[10px] font-bold text-green-600 bg-green-50 border border-green-200 rounded uppercase tracking-wide">Beta</span>
                </div>
              </div>
            </div>
            <button
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              onClick={() => setOpenState(false)}
            >
              <ChevronDown className="w-5 h-5" />
            </button>
          </div>

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden bg-gray-50 dark:bg-gray-900/50 relative">

            {view === 'welcome' && (
              <div className="p-6 flex flex-col h-full animate-in fade-in duration-300">
                <div className="flex-1 flex flex-col justify-center items-start space-y-4">
                  <div className="w-12 h-12 bg-white dark:bg-gray-800 rounded-xl shadow-sm flex items-center justify-center border border-gray-100 dark:border-gray-700 mb-2">
                    <Sparkles className="w-6 h-6 text-green-600" />
                  </div>
                  <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-50">
                    Hi there!
                  </h2>
                  <div className="prose prose-sm text-gray-600 dark:text-gray-300">
                    {config?.greeting_message || "I'm your AI support assistant. I can help with questions, troubleshooting, and more."}
                  </div>
                </div>

                <div className="mt-8">
                  <button
                    onClick={handleStartChat}
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-4 rounded-full shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 group"
                  >
                    Let's chat
                    <MessageSquare className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            )}

            {view === 'chat' && (
              <div className="flex flex-col h-full animate-in slide-in-from-right duration-300">
                {/* Chat Messages */}
                <div className="flex-1 p-4 space-y-4 overflow-y-auto min-h-0">
                  {messages.length === 0 && (
                    <div className="text-center text-gray-400 text-sm mt-8">
                      <Sparkles className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p>Start typing to chat...</p>
                    </div>
                  )}
                  {messages.map((m, idx) => (
                    <ChatMessage key={idx} role={m.role} content={m.content} />
                  ))}
                  {!contactRequest && (kbLoading || kbSuggestions.length > 0) && (
                    <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-3 bg-white/80 dark:bg-gray-800/80 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wide">
                          <BookOpen className="w-4 h-4 text-green-600 dark:text-green-400" />
                          Suggested articles
                        </div>
                        {kbLoading && (
                          <span className="text-[11px] text-gray-500 dark:text-gray-400">Searching KB...</span>
                        )}
                      </div>
                      {kbSuggestions.length > 0 && (
                        <div className="space-y-2">
                          {kbSuggestions.map((article) => (
                            <a
                              key={article.id}
                              href={`/helpcenter/kb/${article.slug}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block rounded-lg border border-gray-200 dark:border-gray-700 p-2 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                            >
                              <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                {article.title}
                              </div>
                              {article.excerpt && (
                                <div className="text-xs text-gray-600 dark:text-gray-300 line-clamp-2">
                                  {article.excerpt}
                                </div>
                              )}
                            </a>
                          ))}
                        </div>
                      )}
                      {kbSuggestions.length > 0 && (
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-600 dark:text-gray-300">Did any of these help?</span>
                          <div className="flex items-center gap-2">
                            <button
                              className="px-3 py-1 text-xs font-medium rounded-full bg-green-600 text-white hover:bg-green-700 transition-colors"
                              onClick={() => handleKbFeedback(true)}
                            >
                              Yes
                            </button>
                            <button
                              className="px-3 py-1 text-xs font-medium rounded-full border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                              onClick={() => handleKbFeedback(false)}
                            >
                              No
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  {contactRequest && (
                    <ChatContactPrompt
                      request={contactRequest}
                      value={contactDraft}
                      onChange={setContactDraft}
                      onSubmit={(contact) => {
                        setContactDraft(contact);
                        sendContactInfo(contact);
                      }}
                    />
                  )}
                  {typing && (
                    <div className="flex items-center gap-2 text-xs text-gray-500 ml-2">
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"></span>
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></span>
                    </div>
                  )}
                  {error && (
                    <div className="text-xs text-red-600 bg-red-50 p-2 rounded border border-red-100">{error}</div>
                  )}
                </div>

                {/* Input Area */}
                <div className="bg-white dark:bg-gray-800 p-2 border-t border-gray-100 dark:border-gray-700">
                  <ChatInput onSend={handleSendMessage} disabled={!connected} />
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 px-4 py-2 text-center">
            <span className="text-[11px] text-gray-500">
              Powered by <a href="https://safaridesk.io" target="_blank" rel="noopener noreferrer" className="font-semibold text-green-600 hover:underline dark:text-green-400">SafariDesk AI</a>
            </span>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatbotWidget;
