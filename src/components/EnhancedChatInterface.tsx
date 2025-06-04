import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, Search, Image, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './auth/AuthProvider';
import ChatHistory from './ChatHistory';
import NewConversationButton from './NewConversationButton';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  type: 'text' | 'image';
  timestamp: Date;
  apiUsed?: string;
}

interface ChatOption {
  id: string;
  label: string;
  icon: React.ReactNode;
  description: string;
  color: string;
}

const EnhancedChatInterface = () => {
  const { user, signOut } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Hello! I\'m your AI assistant powered by OpenAI. I can help you with text generation, image creation, and web search. What would you like to do today?',
      sender: 'bot',
      type: 'text',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string>('text');
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [conversationTitle, setConversationTitle] = useState<string>('New Conversation');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const chatOptions: ChatOption[] = [
    {
      id: 'text',
      label: 'Text Generation',
      icon: <Sparkles className="w-5 h-5" />,
      description: 'Generate creative text using GPT-4o-mini',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      id: 'image',
      label: 'Image Generation', 
      icon: <Image className="w-5 h-5" />,
      description: 'Create stunning images with DALL-E 3',
      color: 'from-purple-500 to-pink-500'
    },
    {
      id: 'search',
      label: 'AI Search',
      icon: <Search className="w-5 h-5" />,
      description: 'Search and get current information with GPT-4o-mini',
      color: 'from-green-500 to-emerald-500'
    }
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const createOrGetConversation = async (firstMessage: string) => {
    if (!user) return null;

    if (currentConversationId) {
      return currentConversationId;
    }

    try {
      const title = firstMessage.length > 50 ? firstMessage.substring(0, 50) + '...' : firstMessage;
      
      const { data, error } = await supabase
        .from('chat_conversations')
        .insert({
          user_id: user.id,
          title: title
        })
        .select()
        .single();

      if (error) throw error;
      
      setCurrentConversationId(data.id);
      setConversationTitle(data.title);
      return data.id;
    } catch (error: any) {
      console.error('Error creating conversation:', error);
      return null;
    }
  };

  const loadConversation = async (conversationId: string, title: string) => {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const loadedMessages: Message[] = [];
      data?.forEach((msg, index) => {
        // Add user message
        loadedMessages.push({
          id: `${msg.id}-user`,
          text: msg.message,
          sender: 'user',
          type: 'text',
          timestamp: new Date(msg.created_at || '')
        });

        // Add bot response
        if (msg.response) {
          loadedMessages.push({
            id: `${msg.id}-bot`,
            text: msg.response,
            sender: 'bot',
            type: msg.response_type as 'text' | 'image' || 'text',
            timestamp: new Date(msg.created_at || ''),
            apiUsed: msg.api_used || undefined
          });
        }
      });

      setMessages(loadedMessages);
      setCurrentConversationId(conversationId);
      setConversationTitle(title);
      
      toast({
        title: "Conversation loaded",
        description: title
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load conversation",
        variant: "destructive"
      });
    }
  };

  const startNewConversation = () => {
    setMessages([
      {
        id: '1',
        text: 'Hello! I\'m your AI assistant powered by OpenAI. I can help you with text generation, image creation, and web search. What would you like to do today?',
        sender: 'bot',
        type: 'text',
        timestamp: new Date()
      }
    ]);
    setCurrentConversationId(null);
    setConversationTitle('New Conversation');
    setInputValue('');
    
    toast({
      title: "New conversation started",
      description: "Ready for your next question!"
    });
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || !user) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputValue,
      sender: 'user',
      type: 'text',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const messageText = inputValue;
    setInputValue('');
    setIsTyping(true);

    try {
      // Create or get conversation
      const conversationId = await createOrGetConversation(messageText);

      const { data, error } = await supabase.functions.invoke('ai-chat', {
        body: {
          message: messageText,
          chatType: selectedOption,
          userId: user.id,
          conversationId: conversationId
        }
      });

      if (error) throw error;

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: data.response,
        sender: 'bot',
        type: data.responseType || 'text',
        timestamp: new Date(),
        apiUsed: data.apiUsed
      };

      setMessages(prev => [...prev, botMessage]);
      
      toast({
        title: "Response generated",
        description: `Using ${data.apiUsed === 'openai-dalle3' ? 'DALL-E 3' : 'GPT-4o-mini'}`,
      });

    } catch (error: any) {
      console.error('Chat error:', error);
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: `Sorry, I encountered an error: ${error.message || 'Please try again.'}`,
        sender: 'bot',
        type: 'text',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, errorMessage]);
      
      toast({
        title: "Error",
        description: error.message || "Failed to get response. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleOptionSelect = (optionId: string) => {
    setSelectedOption(optionId);
    const option = chatOptions.find(opt => opt.id === optionId);
    toast({
      title: `${option?.label} selected`,
      description: option?.description,
    });
  };

  const handleSignOut = async () => {
    await signOut();
    toast({
      title: "Signed out",
      description: "You have been successfully signed out.",
    });
  };

  return (
    <div className="min-h-screen flex flex-col max-w-4xl mx-auto p-4">
      {/* Header */}
      <div className="flex justify-between items-center py-8">
        <div className="flex items-center gap-4">
          <NewConversationButton onNewConversation={startNewConversation} />
          <div className="text-center flex-1">
            <h1 className="text-4xl font-bold text-white mb-2 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              AI Chat Assistant
            </h1>
            <p className="text-slate-400">Powered by OpenAI GPT-4o-mini and DALL-E 3</p>
            <p className="text-slate-500 text-sm mt-1">{conversationTitle}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-slate-400 text-sm">{user?.email}</span>
          <div className="flex flex-col gap-2">
            <ChatHistory onLoadConversation={loadConversation} />
            <Button
              onClick={handleSignOut}
              variant="outline"
              size="sm"
              className="border-slate-600 text-slate-300 hover:bg-slate-800"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>

      {/* Chat Messages */}
      <Card className="flex-1 bg-black/20 backdrop-blur-xl border-slate-700/50 mb-6">
        <CardContent className="p-6 h-96 overflow-y-auto">
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex items-start gap-3 ${
                  message.sender === 'user' ? 'flex-row-reverse' : 'flex-row'
                }`}
              >
                <div className={`p-2 rounded-full ${
                  message.sender === 'user' 
                    ? 'bg-blue-500' 
                    : 'bg-gradient-to-r from-purple-500 to-pink-500'
                }`}>
                  {message.sender === 'user' ? (
                    <User className="w-4 h-4 text-white" />
                  ) : (
                    <Bot className="w-4 h-4 text-white" />
                  )}
                </div>
                <div
                  className={`max-w-sm lg:max-w-md xl:max-w-lg p-4 rounded-2xl ${
                    message.sender === 'user'
                      ? 'bg-blue-500 text-white ml-auto'
                      : 'bg-slate-800/80 text-slate-100 border border-slate-700/50'
                  }`}
                >
                  {message.type === 'image' ? (
                    <div className="space-y-2">
                      <img 
                        src={message.text} 
                        alt="Generated image" 
                        className="rounded-lg max-w-full"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.nextElementSibling!.textContent = 'Failed to load image';
                        }}
                      />
                      <p className="text-xs opacity-70">Generated with DALL-E 3</p>
                    </div>
                  ) : (
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.text}</p>
                  )}
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-xs opacity-70">
                      {message.timestamp.toLocaleTimeString()}
                    </span>
                    {message.apiUsed && (
                      <span className="text-xs opacity-70 bg-slate-700/50 px-2 py-1 rounded">
                        {message.apiUsed === 'openai-dalle3' ? 'DALL-E 3' : 'GPT-4o-mini'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
            
            {isTyping && (
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-500">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div className="bg-slate-800/80 text-slate-100 border border-slate-700/50 p-4 rounded-2xl">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}
          </div>
          <div ref={messagesEndRef} />
        </CardContent>
      </Card>

      {/* Chat Options */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {chatOptions.map((option) => (
          <Card
            key={option.id}
            className={`cursor-pointer transition-all duration-300 hover:scale-105 border-slate-700/50 ${
              selectedOption === option.id
                ? 'bg-gradient-to-r ' + option.color + ' text-white'
                : 'bg-black/20 backdrop-blur-xl hover:bg-black/30'
            }`}
            onClick={() => handleOptionSelect(option.id)}
          >
            <CardContent className="p-4 text-center">
              <div className="flex justify-center mb-2">
                {option.icon}
              </div>
              <h3 className="font-semibold text-sm mb-1">{option.label}</h3>
              <p className="text-xs opacity-80">{option.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Input Area */}
      <Card className="bg-black/20 backdrop-blur-xl border-slate-700/50">
        <CardContent className="p-4">
          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={
                  selectedOption === 'image' 
                    ? 'Describe the image you want to create...'
                    : selectedOption === 'search'
                    ? 'What would you like to search for?'
                    : 'Type your message here...'
                }
                className="bg-slate-800/50 border-slate-600/50 text-white placeholder-slate-400 resize-none"
                disabled={isTyping}
              />
            </div>
            <Button
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isTyping}
              className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white p-3"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
          {selectedOption && (
            <div className="mt-3 text-xs text-slate-400 flex items-center gap-2">
              {chatOptions.find(opt => opt.id === selectedOption)?.icon}
              <span>Mode: {chatOptions.find(opt => opt.id === selectedOption)?.label}</span>
              <span className="opacity-60">
                • {selectedOption === 'image' ? 'DALL-E 3' : 'GPT-4o-mini'}
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default EnhancedChatInterface;
