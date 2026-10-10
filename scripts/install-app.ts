// Add Deutsch Drill to the OS app launcher: `npm run install-app` (builds first).
//   Linux:   ~/.local/bin/deutsch-drill symlink, .desktop entry, icon
//   Windows: Start-menu shortcut (and a desktop shortcut with --desktop)
//   macOS:   no launcher integration yet; prints how to start it
// `node scripts/install-app.ts --uninstall` removes what it created.
import { spawnSync } from 'node:child_process';
import { copyFileSync, mkdirSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { APP_ROOT } from '../src/server/paths.ts';

const uninstall = process.argv.includes('--uninstall');
const desktop = process.argv.includes('--desktop');

function linux() {
  const home = homedir();
  const data = process.env.XDG_DATA_HOME ?? join(home, '.local', 'share');
  const bin = join(home, '.local', 'bin', 'deutsch-drill');
  const entry = join(data, 'applications', 'deutsch-drill.desktop');
  const icon = join(data, 'icons', 'hicolor', 'scalable', 'apps', 'deutsch-drill.svg');
  if (uninstall) {
    for (const f of [bin, entry, icon]) rmSync(f, { force: true });
    console.log('Removed launcher, desktop entry and icon.');
    return;
  }
  for (const f of [bin, entry, icon]) mkdirSync(join(f, '..'), { recursive: true });
  rmSync(bin, { force: true });
  symlinkSync(join(APP_ROOT, 'bin', 'deutsch-drill'), bin);
  copyFileSync(join(APP_ROOT, 'src', 'web', 'public', 'icon.svg'), icon);
  writeFileSync(entry, `[Desktop Entry]
Version=1.0
Name=Deutsch Drill
Comment=Drill German grammar: verb conjugation and more
Exec=${bin}
Terminal=false
Type=Application
Icon=deutsch-drill
Categories=Education;Languages;
StartupWMClass=deutsch-drill
StartupNotify=true
`);
  console.log(`Installed: ${bin} and ${entry}`);
}

function windows() {
  const appData = process.env.APPDATA ?? join(homedir(), 'AppData', 'Roaming');
  const links = [join(appData, 'Microsoft', 'Windows', 'Start Menu', 'Programs', 'Deutsch Drill.lnk')];
  if (desktop || uninstall) {
    const desk = spawnSync('powershell.exe', ['-NoProfile', '-Command', "[Environment]::GetFolderPath('Desktop')"], { encoding: 'utf8' });
    if (desk.stdout.trim()) links.push(join(desk.stdout.trim(), 'Deutsch Drill.lnk'));
  }
  if (uninstall) {
    for (const l of links) rmSync(l, { force: true });
    console.log('Removed shortcuts.');
    return;
  }
  const ps = (s: string) => `'${s.replace(/'/g, "''")}'`;
  // The shortcut runs node.exe directly; WindowStyle 7 = minimized, so the console of the short-lived
  // launcher doesn't flash up in front of the app window.
  const script = links.map((l) => `
$s = (New-Object -ComObject WScript.Shell).CreateShortcut(${ps(l)})
$s.TargetPath = ${ps(process.execPath)}
$s.Arguments = '"' + ${ps(join(APP_ROOT, 'bin', 'deutsch-drill.ts'))} + '"'
$s.WorkingDirectory = ${ps(APP_ROOT)}
$s.IconLocation = ${ps(join(APP_ROOT, 'assets', 'icon.ico'))}
$s.Description = 'Drill German grammar'
$s.WindowStyle = 7
$s.Save()`).join('\n');
  const r = spawnSync('powershell.exe', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', script], { stdio: 'inherit' });
  if (r.status !== 0) throw new Error('Creating the shortcut failed.');
  console.log(`Installed: ${links.join(', ')}`);
}

if (process.platform === 'win32') windows();
else if (process.platform === 'linux') linux();
else console.log(`No launcher integration for ${process.platform} yet. Start the app with: node ${join(APP_ROOT, 'bin', 'deutsch-drill.ts')}`);
