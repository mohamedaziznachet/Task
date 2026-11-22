// dev.js - Lance le backend et le frontend en parallèle avec un seul script Node.js (zéro dépendance externe)
const { spawn } = require('child_process');
const path = require('path');

console.log('\x1b[32m%s\x1b[0m', '═══════════════════════════════════════════════════════');
console.log('\x1b[36m%s\x1b[0m', '  🚀 Lancement simultané du Backend (API) et Frontend  ');
console.log('\x1b[32m%s\x1b[0m', '═══════════════════════════════════════════════════════\n');

const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';

// 1. Démarrer le Backend (Express / MongoDB sur port 5000)
const backend = spawn('npm run dev', {
  cwd: path.join(__dirname, 'backend'),
  stdio: 'pipe',
  shell: true
});

// 2. Démarrer le Frontend (Vite / React sur port 5173)
const frontend = spawn('npm run dev', {
  cwd: path.join(__dirname, 'frontend'),
  stdio: 'pipe',
  shell: true
});

function logWithPrefix(stream, prefix, color) {
  if (!stream) return;
  stream.on('data', (data) => {
    const lines = data.toString().split(/\r?\n/);
    lines.forEach((line) => {
      if (line.trim().length > 0) {
        console.log(`${color}[${prefix}]\x1b[0m ${line}`);
      }
    });
  });
}

// Couleurs ANSI : Cyan pour le Backend, Magenta pour le Frontend
logWithPrefix(backend.stdout, 'BACKEND', '\x1b[36m');
logWithPrefix(backend.stderr, 'BACKEND', '\x1b[33m');

logWithPrefix(frontend.stdout, 'FRONTEND', '\x1b[35m');
logWithPrefix(frontend.stderr, 'FRONTEND', '\x1b[33m');

// Gestion propre de l'arrêt avec Ctrl+C
let isShuttingDown = false;
function shutdown() {
  if (isShuttingDown) return;
  isShuttingDown = true;
  console.log('\n\x1b[31m%s\x1b[0m', '🛑 Arrêt des serveurs Backend et Frontend...');

  if (process.platform === 'win32') {
    if (backend.pid) spawn('taskkill', ['/pid', backend.pid.toString(), '/f', '/t'], { stdio: 'ignore' });
    if (frontend.pid) spawn('taskkill', ['/pid', frontend.pid.toString(), '/f', '/t'], { stdio: 'ignore' });
  } else {
    backend.kill('SIGINT');
    frontend.kill('SIGINT');
  }

  setTimeout(() => {
    process.exit(0);
  }, 500);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
process.on('exit', shutdown);
