import { useState } from 'react';
import { Link } from 'react-router';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Code2, Save, Clock, Languages, CheckCircle, AlertCircle } from 'lucide-react';

export function InterviewSettings() {
  const { user } = useAuth();
  const [settings, setSettings] = useState({
    defaultDuration: 60,
    allowedLanguages: ['Python', 'JavaScript', 'Java', 'C++', 'Go'],
    autoSave: true,
    autoSaveInterval: 2,
    codeExecution: true,
    maxExecutionTime: 10,
    allowHints: true,
    allowReset: true,
    recordSession: true,
    showTimer: true,
    strictMode: false,
    requireWebcam: false,
  });

  const [saved, setSaved] = useState(false);

  const languages = ['Python', 'JavaScript', 'Java', 'C++', 'Go', 'Ruby', 'PHP', 'Swift', 'Kotlin', 'Rust'];

  const handleLanguageToggle = (lang: string) => {
    if (settings.allowedLanguages.includes(lang)) {
      setSettings({
        ...settings,
        allowedLanguages: settings.allowedLanguages.filter(l => l !== lang),
      });
    } else {
      setSettings({
        ...settings,
        allowedLanguages: [...settings.allowedLanguages, lang],
      });
    }
  };

  const handleSave = () => {
    // Save settings to localStorage or API
    localStorage.setItem('interviewSettings', JSON.stringify(settings));
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="min-h-screen" style={{ background: '#0F172A' }}>
      {/* Header */}
      <div className="border-b border-[#334155] bg-[#1E293B]">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#10B981] rounded-lg">
              <Code2 className="w-5 h-5 text-[#0F172A]" />
            </div>
            <div>
              <h1 className="text-lg text-[#F8FAFC]">Interview Settings</h1>
              <p className="text-xs text-[#94A3B8]">Configure default interview parameters</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {saved && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-[#10B981]/10 text-[#10B981] rounded-lg text-sm">
                <CheckCircle className="w-4 h-4" />
                Saved successfully
              </div>
            )}
            <Link to="/dashboard">
              <Button variant="ghost" size="sm">Dashboard</Button>
            </Link>
            <Button onClick={handleSave}>
              <Save className="w-4 h-4 mr-1" />
              Save Changes
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* Session Settings */}
          <div className="bg-[#1E293B] border border-[#334155] rounded-xl p-6">
            <div className="flex items-center gap-2 mb-6">
              <Clock className="w-5 h-5 text-[#10B981]" />
              <h2 className="text-lg text-[#F8FAFC]">Session Settings</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm mb-1.5 text-[#F8FAFC]">
                  Default Interview Duration (minutes)
                </label>
                <Input
                  type="number"
                  value={settings.defaultDuration}
                  onChange={(e) => setSettings({ ...settings, defaultDuration: parseInt(e.target.value) })}
                />
                <p className="text-xs text-[#94A3B8] mt-1">
                  Standard time allocated for each interview session
                </p>
              </div>

              <div className="flex items-center justify-between p-4 bg-[#0F172A] rounded-lg">
                <div>
                  <p className="text-sm text-[#F8FAFC]">Show Timer to Candidates</p>
                  <p className="text-xs text-[#94A3B8]">Display countdown timer during interview</p>
                </div>
                <button
                  onClick={() => setSettings({ ...settings, showTimer: !settings.showTimer })}
                  className={`relative w-12 h-6 rounded-full transition-colors ${
                    settings.showTimer ? 'bg-[#10B981]' : 'bg-[#334155]'
                  }`}
                >
                  <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                    settings.showTimer ? 'translate-x-6' : 'translate-x-0'
                  }`} />
                </button>
              </div>

              <div className="flex items-center justify-between p-4 bg-[#0F172A] rounded-lg">
                <div>
                  <p className="text-sm text-[#F8FAFC]">Record Sessions</p>
                  <p className="text-xs text-[#94A3B8]">Save interview recordings for review</p>
                </div>
                <button
                  onClick={() => setSettings({ ...settings, recordSession: !settings.recordSession })}
                  className={`relative w-12 h-6 rounded-full transition-colors ${
                    settings.recordSession ? 'bg-[#10B981]' : 'bg-[#334155]'
                  }`}
                >
                  <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                    settings.recordSession ? 'translate-x-6' : 'translate-x-0'
                  }`} />
                </button>
              </div>
            </div>
          </div>

          {/* Language Settings */}
          <div className="bg-[#1E293B] border border-[#334155] rounded-xl p-6">
            <div className="flex items-center gap-2 mb-6">
              <Languages className="w-5 h-5 text-[#10B981]" />
              <h2 className="text-lg text-[#F8FAFC]">Allowed Programming Languages</h2>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {languages.map((lang) => (
                <button
                  key={lang}
                  onClick={() => handleLanguageToggle(lang)}
                  className={`p-3 rounded-lg border-2 transition-all text-sm ${
                    settings.allowedLanguages.includes(lang)
                      ? 'border-[#10B981] bg-[#10B981]/10 text-[#10B981]'
                      : 'border-[#334155] bg-[#0F172A] text-[#94A3B8] hover:border-[#94A3B8]'
                  }`}
                >
                  {lang}
                </button>
              ))}
            </div>

            <p className="text-xs text-[#94A3B8] mt-4">
              Selected: {settings.allowedLanguages.length} language{settings.allowedLanguages.length !== 1 ? 's' : ''}
            </p>
          </div>

          {/* Code Execution Settings */}
          <div className="bg-[#1E293B] border border-[#334155] rounded-xl p-6">
            <div className="flex items-center gap-2 mb-6">
              <Code2 className="w-5 h-5 text-[#10B981]" />
              <h2 className="text-lg text-[#F8FAFC]">Code Execution</h2>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-[#0F172A] rounded-lg">
                <div>
                  <p className="text-sm text-[#F8FAFC]">Enable Code Execution</p>
                  <p className="text-xs text-[#94A3B8]">Allow candidates to run their code</p>
                </div>
                <button
                  onClick={() => setSettings({ ...settings, codeExecution: !settings.codeExecution })}
                  className={`relative w-12 h-6 rounded-full transition-colors ${
                    settings.codeExecution ? 'bg-[#10B981]' : 'bg-[#334155]'
                  }`}
                >
                  <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                    settings.codeExecution ? 'translate-x-6' : 'translate-x-0'
                  }`} />
                </button>
              </div>

              {settings.codeExecution && (
                <div>
                  <label className="block text-sm mb-1.5 text-[#F8FAFC]">
                    Max Execution Time (seconds)
                  </label>
                  <Input
                    type="number"
                    value={settings.maxExecutionTime}
                    onChange={(e) => setSettings({ ...settings, maxExecutionTime: parseInt(e.target.value) })}
                  />
                  <p className="text-xs text-[#94A3B8] mt-1">
                    Maximum time allowed for code execution before timeout
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Auto-Save Settings */}
          <div className="bg-[#1E293B] border border-[#334155] rounded-xl p-6">
            <h2 className="text-lg text-[#F8FAFC] mb-6">Auto-Save</h2>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-[#0F172A] rounded-lg">
                <div>
                  <p className="text-sm text-[#F8FAFC]">Enable Auto-Save</p>
                  <p className="text-xs text-[#94A3B8]">Automatically save code changes</p>
                </div>
                <button
                  onClick={() => setSettings({ ...settings, autoSave: !settings.autoSave })}
                  className={`relative w-12 h-6 rounded-full transition-colors ${
                    settings.autoSave ? 'bg-[#10B981]' : 'bg-[#334155]'
                  }`}
                >
                  <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                    settings.autoSave ? 'translate-x-6' : 'translate-x-0'
                  }`} />
                </button>
              </div>

              {settings.autoSave && (
                <div>
                  <label className="block text-sm mb-1.5 text-[#F8FAFC]">
                    Auto-Save Interval (seconds)
                  </label>
                  <Input
                    type="number"
                    value={settings.autoSaveInterval}
                    onChange={(e) => setSettings({ ...settings, autoSaveInterval: parseInt(e.target.value) })}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Advanced Settings */}
          <div className="bg-[#1E293B] border border-[#334155] rounded-xl p-6">
            <div className="flex items-center gap-2 mb-6">
              <AlertCircle className="w-5 h-5 text-[#F59E0B]" />
              <h2 className="text-lg text-[#F8FAFC]">Advanced Settings</h2>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-[#0F172A] rounded-lg">
                <div>
                  <p className="text-sm text-[#F8FAFC]">Allow Hints</p>
                  <p className="text-xs text-[#94A3B8]">Let candidates request hints from AI</p>
                </div>
                <button
                  onClick={() => setSettings({ ...settings, allowHints: !settings.allowHints })}
                  className={`relative w-12 h-6 rounded-full transition-colors ${
                    settings.allowHints ? 'bg-[#10B981]' : 'bg-[#334155]'
                  }`}
                >
                  <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                    settings.allowHints ? 'translate-x-6' : 'translate-x-0'
                  }`} />
                </button>
              </div>

              <div className="flex items-center justify-between p-4 bg-[#0F172A] rounded-lg">
                <div>
                  <p className="text-sm text-[#F8FAFC]">Allow Code Reset</p>
                  <p className="text-xs text-[#94A3B8]">Enable reset to initial template</p>
                </div>
                <button
                  onClick={() => setSettings({ ...settings, allowReset: !settings.allowReset })}
                  className={`relative w-12 h-6 rounded-full transition-colors ${
                    settings.allowReset ? 'bg-[#10B981]' : 'bg-[#334155]'
                  }`}
                >
                  <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                    settings.allowReset ? 'translate-x-6' : 'translate-x-0'
                  }`} />
                </button>
              </div>

              <div className="flex items-center justify-between p-4 bg-[#0F172A] rounded-lg">
                <div>
                  <p className="text-sm text-[#F8FAFC]">Strict Mode</p>
                  <p className="text-xs text-[#94A3B8]">Disable tab switching and copy-paste</p>
                </div>
                <button
                  onClick={() => setSettings({ ...settings, strictMode: !settings.strictMode })}
                  className={`relative w-12 h-6 rounded-full transition-colors ${
                    settings.strictMode ? 'bg-[#10B981]' : 'bg-[#334155]'
                  }`}
                >
                  <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                    settings.strictMode ? 'translate-x-6' : 'translate-x-0'
                  }`} />
                </button>
              </div>

              <div className="flex items-center justify-between p-4 bg-[#0F172A] rounded-lg">
                <div>
                  <p className="text-sm text-[#F8FAFC]">Require Webcam</p>
                  <p className="text-xs text-[#94A3B8]">Mandate webcam during interviews</p>
                </div>
                <button
                  onClick={() => setSettings({ ...settings, requireWebcam: !settings.requireWebcam })}
                  className={`relative w-12 h-6 rounded-full transition-colors ${
                    settings.requireWebcam ? 'bg-[#10B981]' : 'bg-[#334155]'
                  }`}
                >
                  <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                    settings.requireWebcam ? 'translate-x-6' : 'translate-x-0'
                  }`} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
