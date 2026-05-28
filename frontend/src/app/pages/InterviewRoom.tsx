import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import Editor from '@monaco-editor/react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import { StatusDot } from '../components/StatusDot';
import { Play, Send, Clock, X, Users, Sparkles, Copy, Check } from 'lucide-react';

const LANGUAGES = [
  { value: 'python', label: 'Python' },
  { value: 'javascript', label: 'JavaScript' },
  { value: 'java', label: 'Java' },
  { value: 'cpp', label: 'C++' },
  { value: 'go', label: 'Go' },
];

interface Message {
  id: string;
  role: 'user' | 'ai';
  content: string;
  timestamp: Date;
}

export function InterviewRoom() {
  const [code, setCode] = useState('# Write your code here\n\ndef solution():\n    pass');
  const [language, setLanguage] = useState('python');
  const [output, setOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'ai',
      content: 'Hello! I\'m your AI interviewer. Let\'s start with a coding problem. Can you implement a function that finds the two sum in an array?',
      timestamp: new Date(),
    },
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(3600); // 60 minutes
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'reconnecting'>('connected');
  const chatEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeRemaining((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleRunCode = () => {
    setIsRunning(true);
    setOutput('Running code...\n');
    
    // Mock code execution
    setTimeout(() => {
      setOutput(`✓ Code executed successfully\n\nOutput:\nHello, World!\n\nExecution time: 0.042s\nMemory: 2.1 MB`);
      setIsRunning(false);
    }, 1500);
  };

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage,
      timestamp: new Date(),
    };

    setMessages([...messages, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    // Mock AI response
    setTimeout(() => {
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'ai',
        content: 'That\'s a great question! Let me help you with that. Consider using a hash map to store the values you\'ve seen so far...',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMessage]);
      setIsTyping(false);
    }, 2000);
  };

  const handleEndSession = () => {
    if (confirm('Are you sure you want to end this session?')) {
      navigate('/evaluation/1');
    }
  };

  return (
    <div className="h-screen flex flex-col" style={{ background: '#0F172A' }}>
      {/* Top bar */}
      <div className="h-14 border-b border-[#334155] bg-[#1E293B] flex items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <h1 className="text-lg text-[#F8FAFC]">Interview Session</h1>
          <StatusDot status={connectionStatus} showLabel />
        </div>

        <div className="flex items-center gap-4">
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${
            timeRemaining < 300 ? 'bg-[#EF4444]/10 text-[#EF4444]' : 'bg-[#334155] text-[#F8FAFC]'
          }`}>
            <Clock className="w-4 h-4" />
            <span className="text-sm">{formatTime(timeRemaining)}</span>
          </div>
          <Button variant="danger" size="sm" onClick={handleEndSession}>
            <X className="w-4 h-4 mr-1" />
            End Session
          </Button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-hidden">
        <PanelGroup direction="horizontal">
          {/* Left panel - Code Editor */}
          <Panel defaultSize={60} minSize={30}>
            <div className="h-full flex flex-col">
              {/* Editor toolbar */}
              <div className="h-12 border-b border-[#334155] bg-[#1E293B] flex items-center justify-between px-4">
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="px-3 py-1.5 bg-[#0F172A] border border-[#334155] rounded-lg text-[#F8FAFC] text-sm focus:outline-none focus:ring-2 focus:ring-[#10B981]"
                >
                  {LANGUAGES.map((lang) => (
                    <option key={lang.value} value={lang.value}>
                      {lang.label}
                    </option>
                  ))}
                </select>

                <Button size="sm" onClick={handleRunCode} disabled={isRunning}>
                  <Play className="w-4 h-4 mr-1" />
                  {isRunning ? 'Running...' : 'Run Code'}
                </Button>
              </div>

              {/* Monaco Editor */}
              <div className="flex-1">
                <Editor
                  height="60%"
                  language={language}
                  value={code}
                  onChange={(value) => setCode(value || '')}
                  theme="vs-dark"
                  options={{
                    minimap: { enabled: false },
                    fontSize: 14,
                    lineNumbers: 'on',
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                  }}
                />
              </div>

              {/* Output panel */}
              <div className="h-[40%] border-t border-[#334155] bg-[#0F172A] p-4 overflow-auto">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm text-[#94A3B8]">Output</h3>
                </div>
                <pre className={`text-sm font-mono ${
                  output.includes('✓') ? 'text-[#10B981]' : 
                  output.includes('Error') ? 'text-[#EF4444]' : 
                  'text-[#F8FAFC]'
                }`}>
                  {output || 'Run your code to see output here...'}
                </pre>
              </div>
            </div>
          </Panel>

          {/* Resize handle */}
          <PanelResizeHandle className="w-1 bg-[#334155] hover:bg-[#10B981] transition-colors" />

          {/* Right panel - AI Chat */}
          <Panel defaultSize={40} minSize={30}>
            <div className="h-full flex flex-col bg-[#1E293B]">
              {/* Chat header */}
              <div className="h-12 border-b border-[#334155] flex items-center px-4">
                <h3 className="text-sm text-[#F8FAFC]">AI Assistant</h3>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-auto p-4 space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg px-4 py-2 ${
                        message.role === 'user'
                          ? 'bg-[#10B981] text-[#0F172A]'
                          : 'bg-[#334155] text-[#F8FAFC]'
                      }`}
                    >
                      <p className="text-sm">{message.content}</p>
                      <p className={`text-xs mt-1 ${
                        message.role === 'user' ? 'text-[#0F172A]/70' : 'text-[#94A3B8]'
                      }`}>
                        {message.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
                
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-[#334155] rounded-lg px-4 py-3">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-[#10B981] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-2 h-2 bg-[#10B981] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-2 h-2 bg-[#10B981] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Message input */}
              <div className="border-t border-[#334155] p-4">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Ask a question..."
                    className="flex-1 px-4 py-2 bg-[#0F172A] border border-[#334155] rounded-lg text-[#F8FAFC] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#10B981]"
                  />
                  <Button size="sm" onClick={handleSendMessage} disabled={!inputMessage.trim()}>
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </Panel>
        </PanelGroup>
      </div>
    </div>
  );
}
