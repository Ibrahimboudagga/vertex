import {mkdir} from 'node:fs/promises'
import {spawn} from 'node:child_process'
import path from 'node:path'

const run = (binary, args, options) => new Promise((resolve, reject) => {
  const child = spawn(binary, args, {stdio: 'pipe', ...options})
  let stderr = ''
  child.stdout.resume()
  child.stderr.on('data', (chunk) => { stderr += chunk })
  child.on('error', reject)
  child.on('close', (code) => code === 0 ? resolve() : reject(new Error(stderr.trim() || `yt-dlp exited with ${code}`)))
})

export async function assertYtDlp(binary) {
  await run(binary, ['--version'])
}

export async function extractYoutube(source, {rawDirectory, binary}) {
  if (source.provider !== 'youtube') throw new Error(`Unsupported provider: ${source.provider ?? 'unknown'}`)
  const outputDirectory = path.join(rawDirectory, source.key)
  await mkdir(outputDirectory, {recursive: true})
  await run(binary, [
    '--skip-download',
    '--write-info-json',
    '--write-subs',
    '--write-auto-subs',
    '--sub-langs', 'en.*,en',
    '--sub-format', 'vtt',
    '--no-playlist',
    '--output', '%(id)s.%(ext)s',
    source.url,
  ], {cwd: outputDirectory})
  return outputDirectory
}
