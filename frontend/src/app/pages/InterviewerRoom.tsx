import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import Editor from '@monaco-editor/react';
import { api } from '../../lib/api';
import { getSocket } from '../../lib/socket';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import { StatusDot } from '../components/StatusDot';
import { X, Users, Sparkles, Copy, Check, RefreshCw, Eye, Code2 } from 'lucide-react';

interface RosterCandidate {
  id: string;
  status: 'WAITING' | 'ACTIVE' | 'COMPLETED' | 'ABANDONED';
  candidate: { id: string; name: string; email: string } | null;
  evaluation: { id: string; score: number } | null;
  _count: { messages: number; submissions: number };
}

interface ChatMessage {
  id: string;
  role: 'user' | 'ai';
  content: string;
  isStreaming?: boolean;
}

interface RoomInfo {
  id: string;
  roomCode: string;
  status: string;
}

export function InterviewerRoom() {
  const { roomId } = useParams();
  const navigate = useNavigate();

  const [room, setRoom] = useState<RoomInfo | null>(null);
  const [candidates, setCandidates] = useState<RosterCandidate[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] =
    useState<'connected' | 'disconnected' | 'reconnecting'>('disconnected');
  const [copied, setCopied] = useState(false);
  const [ending, setEnding] = useState(false);

  // Live observation state for the selected candidate
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('python');
  const [output, setOutput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const streamingIdRef = useRef<string | null>(null);
  const selectedIdRef = useRef<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // ── Load roster (initial + polling) ────────────────────────────────────────
  const loadRoster = useCallback(async () => {
    if (!roomId) return;
    try {
      const { data } = await api.get(`/sessions/${roomId}/roster`);
      setRoom(data.room);
      setCandidates(data.candidates ?? []);
    } catch {
      // ignore transient errors; polling will retry
    }
  }, [roomId]);

  // ── After the room ends, wait for evaluations then show the results list ────
  // Navigates to the room results page (all candidates + scores) once every
  // candidate has been evaluated. Returns true when ready.
  const finishAndRoute = useCallback(async (): Promise<boolean> => {
    if (!roomId) return false;
    try {
      const { data } = await api.get(`/sessions/${roomId}/roster`);
      const kids: RosterCandidate[] = data.candidates ?? [];
      setRoom(data.room);
      setCandidates(kids);
      // No candidates → nothing to evaluate, still go to the results page.
      const allEvaluated = kids.length === 0 || kids.every((k) => k.evaluation);
      if (!allEvaluated) return false; // still evaluating; caller may retry
      setEnding(false);
      navigate(`/room/${roomId}/results`);
      return true;
    } catch {
      return false;
    }
  }, [roomId, navigate]);

  useEffect(() => {
    loadRoster();
    const t = setInterval(loadRoster, 5000);
    return () => clearInterval(t);
  }, [loadRoster]);

  // ── Socket lifecycle ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!roomId) return;
    const socket = getSocket();

    const onConnect = () => {
      setConnectionStatus('connected');
      // Join the room's own channel so we receive its session:ended event when
      // the interview is ended and the server finishes evaluating candidates.
      socket.emit('observe:join', { sessionId: roomId });
      // re-attach to the candidate we were observing, if any
      if (selectedIdRef.current) {
        socket.emit('observe:join', { sessionId: selectedIdRef.current });
      }
    };
    const onDisconnect = () => setConnectionStatus('disconnected');
    const onReconnectAttempt = () => setConnectionStatus('reconnecting');

    const onObserveJoined = ({
      sessionId, messages: history, code: c, language: l, result,
    }: {
      sessionId: string;
      messages?: { id: string; role: 'user' | 'ai'; content: string }[];
      code?: string | null;
      language?: string | null;
      result?: any;
    }) => {
      if (sessionId !== selectedIdRef.current) return;
      streamingIdRef.current = null;
      setMessages((history ?? []).map((m) => ({ id: m.id, role: m.role, content: m.content })));
      if (c != null) setCode(c);
      if (l) setLanguage(l);
      if (result) {
        const lines: string[] = [];
        lines.push(result.accepted ? `✓ ${result.status}` : `✗ ${result.status}`);
        if (result.stdout) lines.push('', 'Output:', result.stdout);
        if (result.stderr) lines.push('', 'Stderr:', result.stderr);
        if (result.compileOutput) lines.push('', 'Compile:', result.compileOutput);
        setOutput(lines.join('\n'));
      }
    };

    const onChatUser = ({ sessionId, content }: { sessionId: string; content: string }) => {
      if (sessionId !== selectedIdRef.current) return;
      setMessages((prev) => [...prev, { id: `u-${Date.now()}`, role: 'user', content }]);
    };

    const onChatStream = ({ sessionId, chunk }: { sessionId: string; chunk: string }) => {
      if (sessionId !== selectedIdRef.current || !chunk) return;
      if (!streamingIdRef.current) {
        const id = `ai-${Date.now()}`;
        streamingIdRef.current = id;
        setMessages((prev) => [...prev, { id, role: 'ai', content: chunk, isStreaming: true }]);
      } else {
        const id = streamingIdRef.current;
        setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, content: m.content + chunk } : m)));
      }
    };

    const onChatDone = ({ sessionId }: { sessionId: string }) => {
      if (sessionId !== selectedIdRef.current) return;
      const id = streamingIdRef.current;
      if (id) setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, isStreaming: false } : m)));
      streamingIdRef.current = null;
    };

    const onCodeSync = ({ sessionId, code: c, language: l }: { sessionId: string; code: string; language: string }) => {
      if (sessionId !== selectedIdRef.current) return;
      setCode(c);
      if (l) setLanguage(l);
    };

    const onCodeResult = ({ sessionId, result }: { sessionId: string; result: any }) => {
      if (sessionId !== selectedIdRef.current) return;
      const lines: string[] = [];
      lines.push(result.accepted ? `✓ ${result.status}` : `✗ ${result.status}`);
      if (result.stdout) lines.push('', 'Output:', result.stdout);
      if (result.stderr) lines.push('', 'Stderr:', result.stderr);
      if (result.compileOutput) lines.push('', 'Compile:', result.compileOutput);
      setOutput(lines.join('\n'));
    };

    const onCodeRunning = ({ sessionId }: { sessionId: string }) => {
      if (sessionId !== selectedIdRef.current) return;
      setOutput('Candidate is running code…');
    };

    const onSessionEnded = ({ sessionId }: { sessionId: string }) => {
      if (sessionId !== roomId) return;
      // Room ended and the server has evaluated every candidate — route to it.
      finishAndRoute();
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.io.on('reconnect_attempt', onReconnectAttempt);
    socket.on('observe:joined', onObserveJoined);
    socket.on('chat:user', onChatUser);
    socket.on('chat:stream', onChatStream);
    socket.on('chat:done', onChatDone);
    socket.on('code:sync', onCodeSync);
    socket.on('code:result', onCodeResult);
    socket.on('code:running', onCodeRunning);
    socket.on('session:ended', onSessionEnded);

    if (socket.connected) onConnect();

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.io.off('reconnect_attempt', onReconnectAttempt);
      socket.off('observe:joined', onObserveJoined);
      socket.off('chat:user', onChatUser);
      socket.off('chat:stream', onChatStream);
      socket.off('chat:done', onChatDone);
      socket.off('code:sync', onCodeSync);
      socket.off('code:result', onCodeResult);
      socket.off('code:running', onCodeRunning);
      socket.off('session:ended', onSessionEnded);
    };
  }, [roomId, loadRoster, finishAndRoute]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ── Select a candidate to observe ──────────────────────────────────────────
  const handleSelect = (childId: string) => {
    setSelectedId(childId);
    selectedIdRef.current = childId;
    streamingIdRef.current = null;
    setMessages([]);
    setCode('');
    setOutput('');
    // Restore any locally-cached editor content the candidate auto-saved
    const savedCode = localStorage.getItem(`session-${childId}-code`);
    const savedLang = localStorage.getItem(`session-${childId}-language`);
    if (savedCode) setCode(savedCode);
    if (savedLang) setLanguage(savedLang);
    getSocket().emit('observe:join', { sessionId: childId });
  };

  const handleCopyRoomCode = () => {
    navigator.clipboard.writeText(room?.roomCode || roomId || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleEndRoom = () => {
    if (!roomId) return;
    if (!confirm('End the interview for everyone? Each candidate will be evaluated.')) return;
    setEnding(true);
    getSocket().emit('session:end', { sessionId: roomId });
    // Primary path: the server emits session:ended → onSessionEnded routes us.
    // Fallback: poll the roster in case that socket event is missed, so we are
    // never stuck on "Evaluating…". Stops once evaluations are ready.
    let tries = 0;
    const poll = setInterval(async () => {
      tries += 1;
      const done = await finishAndRoute();
      if (done || tries >= 10) clearInterval(poll);
    }, 2000);
  };

  const selected = candidates.find((c) => c.id === selectedId) ?? null;

  return (
    <div className="h-screen flex flex-col" style={{ background: '#0F172A' }}>
      {/* Top bar */}
      <div className="h-14 border-b border-[#334155] bg-[#1E293B] flex items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <h1 className="text-lg text-[#F8FAFC]">Interview Room</h1>
          <div className="flex items-center gap-2 px-3 py-1 bg-[#0F172A] rounded-lg">
            <span className="text-xs text-[#94A3B8]">Room:</span>
            <code className="text-xs text-[#10B981]">{room?.roomCode ?? roomId}</code>
            <button onClick={handleCopyRoomCode} className="ml-1 text-[#94A3B8] hover:text-[#10B981]">
              {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
            </button>
          </div>
          <StatusDot status={connectionStatus} showLabel />
          <div className="flex items-center gap-2 px-3 py-1.5 bg-[#334155] rounded-lg">
            <Users className="w-4 h-4 text-[#F8FAFC]" />
            <span className="text-sm text-[#F8FAFC]">{candidates.length}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={loadRoster}>
            <RefreshCw className="w-4 h-4 mr-1" />
            Refresh
          </Button>
          <Button variant="danger" size="sm" onClick={handleEndRoom} disabled={ending}>
            {ending ? (
              <><RefreshCw className="w-4 h-4 mr-1 animate-spin" />Evaluating…</>
            ) : (
              <><X className="w-4 h-4 mr-1" />End Interview</>
            )}
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex">
        {/* Roster sidebar */}
        <div className="w-72 border-r border-[#334155] bg-[#1E293B] flex flex-col">
          <div className="h-12 border-b border-[#334155] flex items-center px-4">
            <Users className="w-4 h-4 text-[#10B981] mr-2" />
            <h3 className="text-sm text-[#F8FAFC]">Candidates</h3>
          </div>
          <div className="flex-1 overflow-auto p-2 space-y-1">
            {candidates.length === 0 ? (
              <p className="text-sm text-[#94A3B8] p-4 text-center">
                No candidates yet. Share the room code so they can join.
              </p>
            ) : (
              candidates.map((c) => {
                const isSel = c.id === selectedId;
                return (
                  <button
                    key={c.id}
                    onClick={() => (c.evaluation ? navigate(`/evaluation/${c.id}`) : handleSelect(c.id))}
                    className={`w-full text-left p-3 rounded-lg transition-colors ${
                      isSel ? 'bg-[#10B981]/15 border border-[#10B981]' : 'hover:bg-[#334155]/40 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-[#F8FAFC] truncate">
                        {c.candidate?.name ?? 'Unknown'}
                      </p>
                      <StatusDot status={c.status === 'ACTIVE' ? 'connected' : c.status === 'WAITING' ? 'reconnecting' : 'disconnected'} />
                    </div>
                    <p className="text-xs text-[#94A3B8] truncate">{c.candidate?.email ?? ''}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant={c.status === 'COMPLETED' ? 'completed' : 'language'}>
                        {c.status.toLowerCase()}
                      </Badge>
                      {c.evaluation && (
                        <span className="text-xs text-[#10B981]">
                          {c.evaluation.score}% · View report →
                        </span>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Observation area */}
        {!selected ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-[#94A3B8]">
              <Eye className="w-10 h-10 mx-auto mb-3 opacity-50" />
              <p>Select a candidate to watch their session live (read-only).</p>
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-hidden">
            <div className="h-10 border-b border-[#334155] bg-[#1E293B] flex items-center px-4 gap-2">
              <Eye className="w-4 h-4 text-[#10B981]" />
              <span className="text-sm text-[#F8FAFC]">
                Observing {selected.candidate?.name ?? 'candidate'} (read-only)
              </span>
              {selected.evaluation && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="ml-auto"
                  onClick={() => navigate(`/evaluation/${selected.id}`)}
                >
                  View Evaluation
                </Button>
              )}
            </div>

            <PanelGroup direction="horizontal" style={{ height: 'calc(100% - 2.5rem)' }}>
              {/* Read-only code editor + output */}
              <Panel defaultSize={60} minSize={30}>
                <div className="h-full flex flex-col">
                  <div className="h-12 border-b border-[#334155] bg-[#1E293B] flex items-center px-4 gap-2">
                    <Code2 className="w-4 h-4 text-[#94A3B8]" />
                    <span className="text-sm text-[#F8FAFC] capitalize">{language}</span>
                    <Badge variant="language">Live</Badge>
                  </div>
                  <div className="flex-1">
                    <Editor
                      height="60%"
                      language={language === 'cpp' ? 'cpp' : language}
                      value={code}
                      theme="vs-dark"
                      options={{
                        readOnly: true,
                        minimap: { enabled: false },
                        fontSize: 14,
                        scrollBeyondLastLine: false,
                        automaticLayout: true,
                      }}
                    />
                  </div>
                  <div className="h-[40%] border-t border-[#334155] bg-[#0F172A] p-4 overflow-auto">
                    <h3 className="text-sm text-[#94A3B8] mb-2">Output</h3>
                    <pre className="text-sm font-mono whitespace-pre-wrap text-[#F8FAFC]">
                      {output || 'No code run yet…'}
                    </pre>
                  </div>
                </div>
              </Panel>

              <PanelResizeHandle className="w-1 bg-[#334155]" />

              {/* Read-only transcript */}
              <Panel defaultSize={40} minSize={30}>
                <div className="h-full flex flex-col bg-[#1E293B]">
                  <div className="h-12 border-b border-[#334155] flex items-center px-4">
                    <Sparkles className="w-4 h-4 text-[#10B981] mr-2" />
                    <h3 className="text-sm text-[#F8FAFC]">AI Conversation</h3>
                  </div>
                  <div className="flex-1 overflow-auto p-4 space-y-4">
                    {messages.length === 0 && (
                      <p className="text-sm text-[#94A3B8] text-center mt-8">
                        Live transcript will appear here as the candidate talks to the AI.
                      </p>
                    )}
                    {messages.map((m) => (
                      <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] rounded-lg px-4 py-2 ${
                          m.role === 'user' ? 'bg-[#10B981] text-[#0F172A]' : 'bg-[#334155] text-[#F8FAFC]'
                        }`}>
                          <p className="text-sm whitespace-pre-wrap">{m.content}</p>
                          {m.isStreaming && <span className="inline-block w-1 h-4 bg-current ml-1 animate-pulse" />}
                        </div>
                      </div>
                    ))}
                    <div ref={chatEndRef} />
                  </div>
                </div>
              </Panel>
            </PanelGroup>
          </div>
        )}
      </div>
    </div>
  );
}
