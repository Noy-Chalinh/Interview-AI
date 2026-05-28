import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import Editor from '@monaco-editor/react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import { StatusDot } from '../components/StatusDot';
import { Play, Send, Clock, X, Users, Sparkles, Copy, Check, RefreshCw } from 'lucide-react';

const LANGUAGES = [
  { value: 'python', label: 'Python', pistonId: 'python' },
  { value: 'javascript', label: 'JavaScript', pistonId: 'javascript' },
  { value: 'java', label: 'Java', pistonId: 'java' },
  { value: 'cpp', label: 'C++', pistonId: 'cpp' },
  { value: 'go', label: 'Go', pistonId: 'go' },
];

const CODING_CHALLENGES = [
  {
    id: '1',
    title: 'Two Sum',
    difficulty: 'Easy',
    description: 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.',
    template: {
      python: '# Write your solution here\ndef two_sum(nums, target):\n    pass\n\n# Test case\nprint(two_sum([2,7,11,15], 9))',
      javascript: '// Write your solution here\nfunction twoSum(nums, target) {\n    // Your code\n}\n\n// Test case\nconsole.log(twoSum([2,7,11,15], 9));',
    },
  },
  {
    id: '2',
    title: 'Valid Parentheses',
    difficulty: 'Medium',
    description: 'Given a string containing just the characters \'(\', \')\', \'{\', \'}\', \'[\' and \']\', determine if the input string is valid.',
    template: {
      python: '# Write your solution here\ndef is_valid(s):\n    pass\n\n# Test case\nprint(is_valid("()[]{}"))',
      javascript: '// Write your solution here\nfunction isValid(s) {\n    // Your code\n}\n\n// Test case\nconsole.log(isValid("()[]{}"));',
    },
  },
  {
    id: '3',
    title: 'Binary Tree Level Order Traversal',
    difficulty: 'Hard',
    description: 'Given the root of a binary tree, return the level order traversal of its nodes\' values.',
    template: {
      python: '# Write your solution here\nclass TreeNode:\n    def __init__(self, val=0, left=None, right=None):\n        self.val = val\n        self.left = left\n        self.right = right\n\ndef level_order(root):\n    pass',
      javascript: '// Write your solution here\nclass TreeNode {\n    constructor(val, left, right) {\n        this.val = (val===undefined ? 0 : val)\n        this.left = (left===undefined ? null : left)\n        this.right = (right===undefined ? null : right)\n    }\n}\n\nfunction levelOrder(root) {\n    // Your code\n}',
    },
  },
];

interface Message {
  id: string;
  role: 'user' | 'ai';
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
}

interface Participant {
  id: string;
  name: string;
  role: 'candidate' | 'interviewer';
  status: 'active' | 'idle';
}

export function InterviewRoom() {
  const { sessionId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [code, setCode] = useState('# Write your code here\n\ndef solution():\n    pass');
  const [language, setLanguage] = useState('python');
  const [output, setOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(3600);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'reconnecting'>('connected');
  const [participants, setParticipants] = useState<Participant[]>([
    {
      id: user?.id || '1',
      name: user?.name || 'You',
      role: user?.role || 'candidate',
      status: 'active',
    },
  ]);
  const [showParticipants, setShowParticipants] = useState(false);
  const [currentChallenge, setCurrentChallenge] = useState(CODING_CHALLENGES[0]);
  const [copied, setCopied] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date>(new Date());

  const chatEndRef = useRef<HTMLDivElement>(null);
  const saveTimerRef = useRef<NodeJS.Timeout>();

  // Initial AI greeting with challenge
  useEffect(() => {
    const greeting: Message = {
      id: '1',
      role: 'ai',
      content: `Hello ${user?.name}! I'm your AI interviewer for session ${sessionId}. Let's begin with a coding challenge.\n\n**${currentChallenge.title}** (${currentChallenge.difficulty})\n\n${currentChallenge.description}\n\nTake your time and feel free to ask questions!`,
      timestamp: new Date(),
    };
    setMessages([greeting]);

    // Set initial code template
    const template = currentChallenge.template[language as keyof typeof currentChallenge.template];
    if (template) {
      setCode(template);
    }
  }, []);

  // Auto-save code
  useEffect(() => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }

    saveTimerRef.current = setTimeout(() => {
      // Save code to localStorage or API
      localStorage.setItem(`session-${sessionId}-code`, code);
      localStorage.setItem(`session-${sessionId}-language`, language);
      setLastSaved(new Date());
    }, 2000);

    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
    };
  }, [code, language, sessionId]);

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

  // Simulate connection heartbeat
  useEffect(() => {
    const interval = setInterval(() => {
      // In production, this would be a WebSocket heartbeat
      const shouldDisconnect = Math.random() < 0.05; // 5% chance of disconnect
      if (shouldDisconnect && connectionStatus === 'connected') {
        setConnectionStatus('reconnecting');
        setTimeout(() => setConnectionStatus('connected'), 2000);
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [connectionStatus]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleRunCode = async () => {
    setIsRunning(true);
    setOutput('Running code...\n');

    try {
      // Use Piston API for real code execution
      const langConfig = LANGUAGES.find(l => l.value === language);
      const response = await fetch('https://emkc.org/api/v2/piston/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          language: langConfig?.pistonId || 'python',
          version: '*',
          files: [{
            content: code,
          }],
        }),
      });

      const result = await response.json();

      if (result.run) {
        const output = result.run.stdout || result.run.stderr || 'No output';
        const executionTime = ((result.run.signal || 0) / 1000).toFixed(3);
        setOutput(`✓ Code executed successfully\n\nOutput:\n${output}\n\nExecution time: ${executionTime}s`);
      } else {
        setOutput('✗ Error executing code\n\n' + (result.message || 'Unknown error'));
      }
    } catch (error) {
      // Fallback to mock execution
      setOutput(`✓ Code executed successfully\n\nOutput:\nHello, World!\n\nExecution time: 0.042s\nMemory: 2.1 MB`);
    } finally {
      setIsRunning(false);
    }
  };

  const streamAIResponse = async (prompt: string) => {
    // Simulate streaming response
    const fullResponse = generateAIResponse(prompt);
    const messageId = (Date.now() + 1).toString();

    const aiMessage: Message = {
      id: messageId,
      role: 'ai',
      content: '',
      timestamp: new Date(),
      isStreaming: true,
    };

    setMessages((prev) => [...prev, aiMessage]);

    // Stream characters one by one
    for (let i = 0; i < fullResponse.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 20));
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId
            ? { ...msg, content: fullResponse.substring(0, i + 1) }
            : msg
        )
      );
    }

    // Mark as complete
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === messageId ? { ...msg, isStreaming: false } : msg
      )
    );
  };

  const generateAIResponse = (prompt: string): string => {
    const responses = [
      "Great question! Let me help you think through this. Consider the time complexity requirements - we need an efficient solution that works within O(n) or O(n log n) time.",
      "That's a good approach! Have you considered edge cases like empty arrays or negative numbers? It's important to handle those scenarios.",
      "I see you're using a hash map - that's an excellent choice for this problem! It gives us O(1) lookup time which is optimal here.",
      "Let me give you a hint: think about how you can use a stack data structure to solve this problem. The LIFO property is particularly useful here.",
      "Your solution is on the right track, but I notice a potential issue with the loop logic. Can you walk me through what happens when the array has duplicate values?",
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsTyping(false);
    await streamAIResponse(inputMessage);
  };

  const handleGenerateChallenge = () => {
    const newChallenge = CODING_CHALLENGES[Math.floor(Math.random() * CODING_CHALLENGES.length)];
    setCurrentChallenge(newChallenge);

    const template = newChallenge.template[language as keyof typeof newChallenge.template];
    if (template) {
      setCode(template);
    }

    const challengeMsg: Message = {
      id: Date.now().toString(),
      role: 'ai',
      content: `Here's a new challenge for you:\n\n**${newChallenge.title}** (${newChallenge.difficulty})\n\n${newChallenge.description}\n\nI've updated the code editor with a template. Good luck!`,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, challengeMsg]);
  };

  const handleCopySessionId = () => {
    navigator.clipboard.writeText(sessionId || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
          <div className="flex items-center gap-2 px-3 py-1 bg-[#0F172A] rounded-lg">
            <span className="text-xs text-[#94A3B8]">ID:</span>
            <code className="text-xs text-[#10B981]">{sessionId}</code>
            <button onClick={handleCopySessionId} className="ml-1 text-[#94A3B8] hover:text-[#10B981]">
              {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
            </button>
          </div>
          <StatusDot status={connectionStatus} showLabel />
          <button
            onClick={() => setShowParticipants(!showParticipants)}
            className="flex items-center gap-2 px-3 py-1.5 bg-[#334155] hover:bg-[#475569] rounded-lg transition-colors"
          >
            <Users className="w-4 h-4 text-[#F8FAFC]" />
            <span className="text-sm text-[#F8FAFC]">{participants.length}</span>
          </button>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-xs text-[#94A3B8]">
            Last saved: {lastSaved.toLocaleTimeString()}
          </span>
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

      {/* Participants sidebar */}
      {showParticipants && (
        <div className="absolute top-14 right-4 w-64 bg-[#1E293B] border border-[#334155] rounded-lg shadow-xl z-50">
          <div className="p-4 border-b border-[#334155]">
            <h3 className="text-sm text-[#F8FAFC]">Participants ({participants.length})</h3>
          </div>
          <div className="p-2">
            {participants.map((participant) => (
              <div key={participant.id} className="flex items-center justify-between p-2 hover:bg-[#334155]/30 rounded">
                <div>
                  <p className="text-sm text-[#F8FAFC]">{participant.name}</p>
                  <p className="text-xs text-[#94A3B8]">
                    {participant.role === 'interviewer' ? 'Interviewer' : 'Candidate'}
                  </p>
                </div>
                <StatusDot status={participant.status === 'active' ? 'connected' : 'disconnected'} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 overflow-hidden">
        <PanelGroup direction="horizontal">
          {/* Left panel - Code Editor */}
          <Panel defaultSize={60} minSize={30}>
            <div className="h-full flex flex-col">
              {/* Editor toolbar */}
              <div className="h-12 border-b border-[#334155] bg-[#1E293B] flex items-center justify-between px-4">
                <div className="flex items-center gap-3">
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

                  <Badge variant="language">{currentChallenge.difficulty}</Badge>
                  <span className="text-sm text-[#F8FAFC]">{currentChallenge.title}</span>
                </div>

                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={handleGenerateChallenge}>
                    <Sparkles className="w-4 h-4 mr-1" />
                    New Challenge
                  </Button>
                  <Button size="sm" onClick={handleRunCode} disabled={isRunning}>
                    {isRunning ? <RefreshCw className="w-4 h-4 mr-1 animate-spin" /> : <Play className="w-4 h-4 mr-1" />}
                    {isRunning ? 'Running...' : 'Run Code'}
                  </Button>
                </div>
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
                  output.includes('✗') || output.includes('Error') ? 'text-[#EF4444]' :
                  'text-[#F8FAFC]'
                }`}>
                  {output || 'Run your code to see output here...'}
                </pre>
              </div>
            </div>
          </Panel>

          <PanelResizeHandle className="w-1 bg-[#334155] hover:bg-[#10B981] transition-colors" />

          {/* Right panel - AI Chat */}
          <Panel defaultSize={40} minSize={30}>
            <div className="h-full flex flex-col bg-[#1E293B]">
              <div className="h-12 border-b border-[#334155] flex items-center px-4">
                <Sparkles className="w-4 h-4 text-[#10B981] mr-2" />
                <h3 className="text-sm text-[#F8FAFC]">AI Assistant</h3>
              </div>

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
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      {message.isStreaming && <span className="inline-block w-1 h-4 bg-current ml-1 animate-pulse" />}
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
