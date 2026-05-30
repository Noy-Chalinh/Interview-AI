import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import Editor from '@monaco-editor/react';
import { useAuth } from '../contexts/AuthContext';
import { getSocket } from '../../lib/socket';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import { StatusDot } from '../components/StatusDot';
import {
  Play, Send, Clock, X, Users, Sparkles, Copy, Check, RefreshCw,
} from 'lucide-react';

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
  isStreaming?: boolean;
}

interface Participant {
  id: string;
  name: string;
  role: 'candidate' | 'interviewer';
  status: 'active' | 'idle';
}

interface CodeResult {
  status: string;
  accepted: boolean;
  stdout: string;
  stderr: string;
  compileOutput: string;
  time: number | null;
  memory: number | null;
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
  const [connectionStatus, setConnectionStatus] =
    useState<'connected' | 'disconnected' | 'reconnecting'>('disconnected');
  const [participants, setParticipants] = useState<Participant[]>(
    user
      ? [{ id: user.id, name: user.name, role: user.role, status: 'active' }]
      : []
  );
  const [showParticipants, setShowParticipants] = useState(false);
  const [copied, setCopied] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date>(new Date());
  const [roomCode, setRoomCode] = useState<string | null>(null);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const streamingMessageIdRef = useRef<string | null>(null);

  // ── Fetch roomCode for display ─────────────────────────────────────────────
  useEffect(() => {
    if (!sessionId) return;
    import('../../lib/api').then(({ api }) => {
      api.get(`/sessions/${sessionId}`)
        .then(({ data }) => setRoomCode(data.session?.roomCode ?? null))
        .catch(() => {});
    });
  }, [sessionId]);

  // ── Socket lifecycle ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!sessionId) return;

    const socket = getSocket();

    const onConnect = () => {
      setConnectionStatus('connected');
      socket.emit('session:join', { sessionId });
    };

    const onDisconnect = () => setConnectionStatus('disconnected');
    const onReconnectAttempt = () => setConnectionStatus('reconnecting');

    const onSessionStart = () => {
      socket.emit('chat:start', { sessionId });
    };

    const onSessionReconnected = ({ remainingSeconds }: { remainingSeconds: number | null }) => {
      if (typeof remainingSeconds === 'number') setTimeRemaining(remainingSeconds);
    };

    const onSessionError = ({ message }: { message: string }) => {
      setOutput(`Session error: ${message}`);
    };

    const onTimer = ({ remaining }: { remaining: number }) => {
      setTimeRemaining(remaining);
    };

    const onTimeout = () => {
      setMessages((prev) => [
        ...prev,
        {
          id: `timeout-${Date.now()}`,
          role: 'ai',
          content: "Time's up — wrapping the session.",
          timestamp: new Date(),
        },
      ]);
      socket.emit('session:evaluate', { sessionId });
    };

    const onChatStream = ({ chunk }: { chunk: string }) => {
      if (!chunk) return;
      setIsTyping(false);

      if (!streamingMessageIdRef.current) {
        const id = `ai-${Date.now()}`;
        streamingMessageIdRef.current = id;
        setMessages((prev) => [
          ...prev,
          { id, role: 'ai', content: chunk, timestamp: new Date(), isStreaming: true },
        ]);
      } else {
        const id = streamingMessageIdRef.current;
        setMessages((prev) =>
          prev.map((m) => (m.id === id ? { ...m, content: m.content + chunk } : m))
        );
      }
    };

    const onChatDone = () => {
      const id = streamingMessageIdRef.current;
      if (id) {
        setMessages((prev) =>
          prev.map((m) => (m.id === id ? { ...m, isStreaming: false } : m))
        );
      }
      streamingMessageIdRef.current = null;
    };

    const onChatError = ({ message }: { message: string }) => {
      setIsTyping(false);
      streamingMessageIdRef.current = null;
      setMessages((prev) => [
        ...prev,
        { id: `err-${Date.now()}`, role: 'ai', content: `⚠️ ${message}`, timestamp: new Date() },
      ]);
    };

    const onCodeRunning = () => {
      setIsRunning(true);
      setOutput('Running code…');
    };

    const onCodeResult = ({ result }: { result: CodeResult }) => {
      setIsRunning(false);
      const lines: string[] = [];
      lines.push(result.accepted ? `✓ ${result.status}` : `✗ ${result.status}`);
      if (result.stdout) lines.push('', 'Output:', result.stdout);
      if (result.stderr) lines.push('', 'Stderr:', result.stderr);
      if (result.compileOutput) lines.push('', 'Compile:', result.compileOutput);
      if (result.time != null) lines.push('', `Time: ${result.time}s  Memory: ${result.memory ?? '-'}KB`);
      setOutput(lines.join('\n'));
    };

    const onCodeError = ({ message }: { message: string }) => {
      setIsRunning(false);
      setOutput(`✗ ${message}`);
    };

    const onEvaluationProcessing = () => {
      setMessages((prev) => [
        ...prev,
        {
          id: `eval-proc-${Date.now()}`,
          role: 'ai',
          content: 'Generating your evaluation…',
          timestamp: new Date(),
        },
      ]);
    };

    const onEvaluationDone = () => {
      // The Evaluation page loads by session id, which is always available here.
      navigate(`/evaluation/${sessionId}`);
    };

    const onUserOnline = ({ userId }: { userId: string }) => {
      setParticipants((prev) =>
        prev.some((p) => p.id === userId)
          ? prev.map((p) => (p.id === userId ? { ...p, status: 'active' } : p))
          : [...prev, { id: userId, name: 'Participant', role: 'interviewer', status: 'active' }]
      );
    };

    const onUserOffline = ({ userId }: { userId: string }) => {
      setParticipants((prev) =>
        prev.map((p) => (p.id === userId ? { ...p, status: 'idle' } : p))
      );
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.io.on('reconnect_attempt', onReconnectAttempt);
    socket.on('session:start', onSessionStart);
    socket.on('session:reconnected', onSessionReconnected);
    socket.on('session:error', onSessionError);
    socket.on('session:timer', onTimer);
    socket.on('session:timeout', onTimeout);
    socket.on('chat:stream', onChatStream);
    socket.on('chat:done', onChatDone);
    socket.on('chat:error', onChatError);
    socket.on('code:running', onCodeRunning);
    socket.on('code:result', onCodeResult);
    socket.on('code:error', onCodeError);
    socket.on('evaluation:processing', onEvaluationProcessing);
    socket.on('evaluation:done', onEvaluationDone);
    socket.on('user:online', onUserOnline);
    socket.on('user:offline', onUserOffline);

    if (socket.connected) {
      onConnect();
    }

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.io.off('reconnect_attempt', onReconnectAttempt);
      socket.off('session:start', onSessionStart);
      socket.off('session:reconnected', onSessionReconnected);
      socket.off('session:error', onSessionError);
      socket.off('session:timer', onTimer);
      socket.off('session:timeout', onTimeout);
      socket.off('chat:stream', onChatStream);
      socket.off('chat:done', onChatDone);
      socket.off('chat:error', onChatError);
      socket.off('code:running', onCodeRunning);
      socket.off('code:result', onCodeResult);
      socket.off('code:error', onCodeError);
      socket.off('evaluation:processing', onEvaluationProcessing);
      socket.off('evaluation:done', onEvaluationDone);
      socket.off('user:online', onUserOnline);
      socket.off('user:offline', onUserOffline);
    };
  }, [sessionId, navigate]);

  // ── Auto-save code locally + broadcast to observers (interviewer) ──────────
  useEffect(() => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      localStorage.setItem(`session-${sessionId}-code`, code);
      localStorage.setItem(`session-${sessionId}-language`, language);
      setLastSaved(new Date());
      // Live-sync editor state so an observing interviewer sees it read-only.
      const socket = getSocket();
      if (socket.connected) {
        socket.emit('code:sync', { sessionId, code, language });
      }
    }, 2000);
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [code, language, sessionId]);

  // ── Restore saved code on mount ────────────────────────────────────────────
  useEffect(() => {
    const savedCode = localStorage.getItem(`session-${sessionId}-code`);
    const savedLang = localStorage.getItem(`session-${sessionId}-language`);
    if (savedCode) setCode(savedCode);
    if (savedLang) setLanguage(savedLang);
  }, [sessionId]);

  // ── Auto-scroll chat ───────────────────────────────────────────────────────
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleRunCode = () => {
    if (!sessionId || !code.trim()) return;
    const socket = getSocket();
    setIsRunning(true);
    setOutput('Running code…');
    socket.emit('code:execute', { sessionId, language, code });
  };

  const handleSendMessage = () => {
    const text = inputMessage.trim();
    if (!text || !sessionId) return;
    const socket = getSocket();

    setMessages((prev) => [
      ...prev,
      { id: `u-${Date.now()}`, role: 'user', content: text, timestamp: new Date() },
    ]);
    setInputMessage('');
    setIsTyping(true);

    socket.emit('chat:message', { sessionId, content: text });
  };

  const handleCopyRoomCode = () => {
    navigator.clipboard.writeText(roomCode || sessionId || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleEndSession = () => {
    if (!sessionId) return;
    if (!confirm('Are you sure you want to end this session?')) return;
    const socket = getSocket();
    // Mark the session completed and generate the evaluation. generateEvaluation
    // always produces a row now, so evaluation:done reliably fires and navigates.
    socket.emit('session:end', { sessionId });
    socket.emit('session:evaluate', { sessionId });
  };

  return (
    <div className="h-screen flex flex-col" style={{ background: '#0F172A' }}>
      {/* Top bar */}
      <div className="h-14 border-b border-[#334155] bg-[#1E293B] flex items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <h1 className="text-lg text-[#F8FAFC]">Interview Session</h1>
          <div className="flex items-center gap-2 px-3 py-1 bg-[#0F172A] rounded-lg">
            <span className="text-xs text-[#94A3B8]">Room:</span>
            <code className="text-xs text-[#10B981]">{roomCode ?? sessionId}</code>
            <button onClick={handleCopyRoomCode} className="ml-1 text-[#94A3B8] hover:text-[#10B981]">
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

                  <Badge variant="language">Live</Badge>
                </div>

                <div className="flex items-center gap-2">
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
                  language={language === 'cpp' ? 'cpp' : language}
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
                <pre className={`text-sm font-mono whitespace-pre-wrap ${
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
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
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
