/* global process */
import { spawn } from 'child_process'
import { dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

const vite = spawn(
  process.platform === 'win32' ? 'npm.cmd' : 'npm',
  ['run', 'dev'],
  { cwd: __dirname, stdio: 'inherit', shell: true }
)

vite.on('exit', (code) => process.exit(code ?? 0))
