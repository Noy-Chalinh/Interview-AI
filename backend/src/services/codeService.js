const judge0 = require('../config/judge0');
const prisma = require('../config/db');

// ── Language ID map ───────────────────────────────────────────────────────────
// Judge0 language IDs — full list at http://localhost:2358/languages

const LANGUAGE_MAP = {
  javascript: 63,
  python:     71,
  java:       62,
  cpp:        54,
  c:          50,
  typescript: 74,
  go:         60,
  rust:       73,
  kotlin:     78,
  swift:      83,
  csharp:     51,
  php:        68,
  ruby:       72,
};

// ── Status codes from Judge0 ──────────────────────────────────────────────────

const STATUS = {
  1:  'In Queue',
  2:  'Processing',
  3:  'Accepted',
  4:  'Wrong Answer',
  5:  'Time Limit Exceeded',
  6:  'Compilation Error',
  7:  'Runtime Error (SIGSEGV)',
  8:  'Runtime Error (SIGXFSZ)',
  9:  'Runtime Error (SIGFPE)',
  10: 'Runtime Error (SIGABRT)',
  11: 'Runtime Error (NZEC)',
  12: 'Runtime Error (Other)',
  13: 'Internal Error',
  14: 'Exec Format Error',
};

// ── Submit code to Judge0 ─────────────────────────────────────────────────────

async function submitCode(language, code, stdin = '') {
  const languageId = LANGUAGE_MAP[language.toLowerCase()];

  if (!languageId) {
    throw new Error(`Unsupported language: ${language}. Supported: ${Object.keys(LANGUAGE_MAP).join(', ')}`);
  }

  // submit and wait for result in one request (wait=true)
  const response = await judge0.post('/submissions', {
    source_code:    Buffer.from(code).toString('base64'),
    language_id:    languageId,
    stdin:          stdin ? Buffer.from(stdin).toString('base64') : '',
    cpu_time_limit: 5,        // 5 seconds max
    memory_limit:   128000,   // 128MB max
    encode_base64:  true,
  }, {
    params: { base64_encoded: true, wait: true },
    timeout: 15000 // 15s axios timeout
  });

  return parseResult(response.data);
}

// ── Parse Judge0 response ─────────────────────────────────────────────────────

function parseResult(data) {
  const statusId = data.status?.id;
  const statusDesc = STATUS[statusId] || 'Unknown';

  // decode base64 outputs
  const stdout = data.stdout
    ? Buffer.from(data.stdout, 'base64').toString('utf-8')
    : '';
  const stderr = data.stderr
    ? Buffer.from(data.stderr, 'base64').toString('utf-8')
    : '';
  const compileOutput = data.compile_output
    ? Buffer.from(data.compile_output, 'base64').toString('utf-8')
    : '';

  return {
    statusId,
    status:         statusDesc,
    accepted:       statusId === 3,
    timeLimitExceeded: statusId === 5,
    stdout:         stdout.trim(),
    stderr:         stderr.trim(),
    compileOutput:  compileOutput.trim(),
    time:           data.time,       // execution time in seconds
    memory:         data.memory,     // memory used in KB
  };
}

// ── Execute and persist to DB ─────────────────────────────────────────────────

async function executeAndSave(sessionId, language, code, stdin = '') {
  let result;

  try {
    result = await submitCode(language, code, stdin);
  } catch (err) {
    // Judge0 unreachable or timeout
    result = {
      statusId:   13,
      status:     'Internal Error',
      accepted:   false,
      stdout:     '',
      stderr:     err.message,
      compileOutput: '',
      time:       null,
      memory:     null,
    };
  }

  // persist to DB regardless of success or failure
  await prisma.codeSubmission.create({
    data: {
      sessionId,
      language,
      code,
      result,
    }
  });

  return result;
}

// ── Get supported languages ───────────────────────────────────────────────────

function getSupportedLanguages() {
  return Object.keys(LANGUAGE_MAP).map((name) => ({
    name,
    id: LANGUAGE_MAP[name]
  }));
}

module.exports = {
  executeAndSave,
  getSupportedLanguages,
  LANGUAGE_MAP
};