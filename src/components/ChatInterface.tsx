
import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, Search, Image } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  type: 'text' | 'image';
  timestamp: Date;
}

interface ChatOption {
  id: string;
  label: string;
  icon: React.ReactNode;
  description: string;
  color: string;
}

const ChatInterface = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Hello! I\'m your AI assistant. I can help you with text generation, image creation, and web search. What would you like to do today?',
      sender: 'bot',
      type: 'text',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const chatOptions: ChatOption[] = [
    {
      id: 'text',
      label: 'Text Generation',
      icon: <Sparkles className="w-5 h-5" />,
      description: 'Generate creative text, stories, or answers',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      id: 'image',
      label: 'Image Generation', 
      icon: <Image className="w-5 h-5" />,
      description: 'Create stunning AI-generated images',
      color: 'from-purple-500 to-pink-500'
    },
    {
      id: 'search',
      label: 'Web Search',
      icon: <Search className="w-5 h-5" />,
      description: 'Search the web for current information',
      color: 'from-green-500 to-emerald-500'
    }
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputValue,
      sender: 'user',
      type: 'text',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      const responseText = selectedOption === 'image' 
        ? 'I would generate an image for you, but the APIs are not yet connected. This is a demo of the interface!'
        : selectedOption === 'search'
        ? 'I would search the web for that information, but the search API is not yet connected. This is a demo!'
        : 'This is a demo response! In the full version, I would process your request using advanced AI.';

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: responseText,
        sender: 'bot',
        type: 'text',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botMessage]);
      setIsTyping(false);
    }, 2000);
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

  return (
    <div className="min-h-screen flex flex-col max-w-4xl mx-auto p-4">
      {/* Header */}
      <div className="text-center py-8">
        <h1 className="text-4xl font-bold text-white mb-2 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
          AI Chat Assistant
        </h1>
        <p className="text-slate-400">Powered by multiple AI providers for the best results</p>
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
                  <p className="text-sm leading-relaxed">{message.text}</p>
                  <span className="text-xs opacity-70 mt-2 block">
                    {message.timestamp.toLocaleTimeString()}
                  </span>
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
                placeholder="Type your message here..."
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
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ChatInterface;
