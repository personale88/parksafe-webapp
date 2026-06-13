#!/usr/bin/env node
/**
 * Railway build & start helper for the pnpm monorepo.
 * Compiles workspace packages to dist/ and verifies Node resolves compiled JS (not .ts source).
 */

import { execSync } from 'node:child_process'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')

const WORKSPACE_PACKAGES = [
  { dir: 'packages/types', name: '@parksafe/types' },
  { dir: 'packages/db', name: '@parksafe/db' },
]

function run(cmd, cwd = ROOT) {
  console.log(`[railway] $ ${cmd}`)
  execSync(cmd, { cwd, stdio: 'inherit', env: process.env })
}

function fixPackageExports(pkgDir, pkgName) {
  const pkgPath = path.join(ROOT, pkgDir, 'package.json')
  const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'))
  const distMain = './dist/index.js'
  const distTypes = './dist/index.d.ts'
  let changed = false

  if (pkg.main !== distMain) {
    console.warn(`[railway] ${pkgName}: fixing main (${pkg.main} -> ${distMain})`)
    pkg.main = distMain
    changed = true
  }

  if (pkg.types !== distTypes) {
    console.warn(`[railway] ${pkgName}: fixing types (${pkg.types} -> ${distTypes})`)
    pkg.types = distTypes
    changed = true
  }

  const entry = pkg.exports?.['.']
  const entryDefault = typeof entry === 'string' ? entry : entry?.default
  if (!entryDefault?.includes('/dist/')) {
    console.warn(`[railway] ${pkgName}: fixing exports -> dist`)
    pkg.exports = {
      ...pkg.exports,
      '.': { types: distTypes, default: distMain },
    }
    changed = true
  }

  if (changed) {
    writeFileSync(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`)
  }
}

function compileWorkspacePackages() {
  for (const { dir, name } of WORKSPACE_PACKAGES) {
    fixPackageExports(dir, name)
    run('pnpm exec tsc -p tsconfig.json', path.join(ROOT, dir))

    const distEntry = path.join(ROOT, dir, 'dist/index.js')
    if (!existsSync(distEntry)) {
      throw new Error(`[railway] ${name}: missing ${distEntry} after tsc`)
    }
    console.log(`[railway] ${name}: compiled -> ${distEntry}`)
  }
}

function verifyWorkspaceResolution() {
  const apiDir = path.join(ROOT, 'apps/api')
  const requireFromApi = createRequire(path.join(apiDir, 'package.json'))

  for (const { name } of WORKSPACE_PACKAGES) {
    const resolved = requireFromApi.resolve(name)
    if (resolved.includes('/src/') || resolved.endsWith('.ts')) {
      throw new Error(
        `[railway] ${name} still resolves to TypeScript source: ${resolved}\n` +
          'Clear Railway build cache and redeploy.'
      )
    }
    if (!resolved.includes('/dist/')) {
      throw new Error(`[railway] ${name} unexpected resolve path: ${resolved}`)
    }
    console.log(`[railway] ${name} resolves OK -> ${resolved}`)
  }
}

function build() {
  console.log('[railway] === BUILD ===')
  compileWorkspacePackages()
  run('pnpm exec tsc -p tsconfig.json', path.join(ROOT, 'apps/api'))

  const serverEntry = path.join(ROOT, 'apps/api/dist/server.js')
  if (!existsSync(serverEntry)) {
    throw new Error(`[railway] missing ${serverEntry} after api tsc`)
  }

  verifyWorkspaceResolution()
  console.log('[railway] === BUILD OK ===')
}

function start() {
  console.log('[railway] === START ===')
  compileWorkspacePackages()
  verifyWorkspaceResolution()
  run('node dist/server.js', path.join(ROOT, 'apps/api'))
}

const command = process.argv[2]
if (command === 'build') {
  build()
} else if (command === 'start') {
  start()
} else {
  console.error('Usage: node scripts/railway.mjs <build|start>')
  process.exit(1)
}
