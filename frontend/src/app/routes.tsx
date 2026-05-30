import { Routes, Route, Navigate } from 'react-router';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { SessionLobby } from './pages/SessionLobby';
import { Dashboard } from './pages/Dashboard';
import { InterviewRoom } from './pages/InterviewRoomEnhanced';
import { InterviewerRoom } from './pages/InterviewerRoom';
import { RoomResults } from './pages/RoomResults';
import { Evaluation } from './pages/Evaluation';
import { History } from './pages/History';
import { QuestionBank } from './pages/QuestionBank';
import { InterviewSettings } from './pages/InterviewSettings';

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route path="/lobby" element={
        <ProtectedRoute>
          <SessionLobby />
        </ProtectedRoute>
      } />

      <Route path="/dashboard" element={
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      } />

      <Route path="/interview/:sessionId" element={
        <ProtectedRoute>
          <InterviewRoom />
        </ProtectedRoute>
      } />

      <Route path="/room/:roomId" element={
        <ProtectedRoute>
          <InterviewerRoom />
        </ProtectedRoute>
      } />

      <Route path="/room/:roomId/results" element={
        <ProtectedRoute>
          <RoomResults />
        </ProtectedRoute>
      } />

      <Route path="/evaluation/:id" element={
        <ProtectedRoute>
          <Evaluation />
        </ProtectedRoute>
      } />

      <Route path="/history" element={
        <ProtectedRoute>
          <History />
        </ProtectedRoute>
      } />

      <Route path="/questions" element={
        <ProtectedRoute>
          <QuestionBank />
        </ProtectedRoute>
      } />

      <Route path="/settings" element={
        <ProtectedRoute>
          <InterviewSettings />
        </ProtectedRoute>
      } />

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
