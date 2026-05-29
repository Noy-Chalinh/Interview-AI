const piston = require('../config/piston');
const prisma = require('../config/db');

// ── Language map ──────────────────────────────────────────────────────────────
// Maps our user-facing language names to Piston runtime identifiers.
// Versions are pinned with '*' (latest installed runtime).

// Piston's /execute endpoint uses runtime aliases (e.g. "javascript", "c++"),
// which differ from the /packages keys ("node", "gcc"). Confirmed via
// /api/v2/runtimes after installation.
const LANGUAGE_MAP = {
  javascript: { lang: 'javascript', filename: 'main' },
  typescript: { lang: 'typescript', filename: 'main' },
  python:     { lang: 'python',     filename: 'main' },
  java:       { lang: 'java',       filename: 'Main' },
  cpp:        { lang: 'c++',        filename: 'main' },
  c:          { lang: 'c',          filename: 'main' },
  go:         { lang: 'go',         filename: 'main' },
  rust:       { lang: 'rust',       filename: 'main' },
  kotlin:     { lang: 'kotlin',     filename: 'main' },
  swift:      { lang: 'swift',      filename: 'main' },
  csharp:     { lang: 'csharp.net', filename: 'main' },
  php:        { lang: 'php',        filename: 'main' },
  ruby:       { lang: 'ruby',       filename: 'main' },
};

// ── Submit code to Piston ─────────────────────────────────────────────────────

async function submitCode(language, code, stdin = '') {
  const cfg = LANGUAGE_MAP[language.toLowerCase()];

  if (!cfg) {
    throw new Error(
      `Unsupported language: ${language}. Supported: ${Object.keys(LANGUAGE_MAP).join(', ')}`
    );
  }

  const response = await piston.post('/api/v2/execute', {
    language: cfg.lang,
    version: '*',
    files: [{ name: cfg.filename, content: code }],
    stdin,
    compile_timeout: 10000,
    run_timeout:     3000,
    compile_memory_limit: -1,
    run_memory_limit:     -1,
  });

  return parseResult(response.data);
}

// ── Parse Piston response ─────────────────────────────────────────────────────
//
// Piston returns:
//   {
//     language, version,
//     compile: { stdout, stderr, output, code, signal } (optional),
//     run:     { stdout, stderr, output, code, signal }
//   }
//
// We translate that into the same result shape the rest of the app already
// expects, so callers and the DB JSON column don't need to change.

function parseResult(data) {
  const run = data.run || {};
  const compile = data.compile || {};

  const stdout = (run.stdout || '').trim();
  const stderr = (run.stderr || '').trim();
  const compileOutput = (compile.stderr || compile.output || '').trim();

  // Synthesise a Judge0-style statusId so the existing UI mapping still works.
  //  3  = Accepted
  //  6  = Compilation Error
  //  5  = Time Limit Exceeded (Piston reports signal=SIGKILL on timeout)
  // 11  = Runtime Error
  // 13  = Internal Error
  let statusId = 3;
  let status = 'Accepted';

  if (compile.code && compile.code !== 0) {
    statusId = 6;
    status = 'Compilation Error';
  } else if (run.signal === 'SIGKILL') {
    statusId = 5;
    status = 'Time Limit Exceeded';
  } else if (run.code && run.code !== 0) {
    statusId = 11;
    status = 'Runtime Error';
  }

  return {
    statusId,
    status,
    accepted:          statusId === 3,
    timeLimitExceeded: statusId === 5,
    stdout,
    stderr,
    compileOutput,
    message:           '',
    time:              null, // Piston does not report execution time
    memory:            null,
    language:          data.language,
    version:           data.version,
  };
}

// ── Execute and persist ───────────────────────────────────────────────────────

async function executeAndSave(sessionId, language, code, stdin = '') {
  let result;

  try {
    result = await submitCode(language, code, stdin);
  } catch (err) {
    const pistonError =
      err.response?.data?.message ||
      err.response?.data?.error ||
      err.message;

    result = {
      statusId:   13,
      status:     'Internal Error',
      accepted:   false,
      timeLimitExceeded: false,
      stdout:     '',
      stderr:     pistonError || 'Code execution failed',
      compileOutput: '',
      message:    pistonError || '',
      time:       null,
      memory:     null,
    };
  }

  await prisma.codeSubmission.create({
    data: {
      sessionId,
      language,
      code,
      result,
    },
  });

  return result;
}

// ── Get supported languages ───────────────────────────────────────────────────

function getSupportedLanguages() {
  return Object.keys(LANGUAGE_MAP).map((name) => ({
    name,
    runtime: LANGUAGE_MAP[name].lang,
  }));
}

module.exports = {
  executeAndSave,
  getSupportedLanguages,
  LANGUAGE_MAP,
};
