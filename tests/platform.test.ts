import { describe, expect, it } from 'vitest';
import { browserCandidates, findBrowser, resolveExecutable } from '../src/launcher/browser.ts';
import { appDirs } from '../src/server/paths.ts';

describe('appDirs', () => {
  it('Windows uses APPDATA / LOCALAPPDATA', () => {
    const d = appDirs('win32', { APPDATA: 'C:\\Users\\f\\AppData\\Roaming', LOCALAPPDATA: 'C:\\Users\\f\\AppData\\Local' }, 'C:\\Users\\f');
    expect(d).toEqual({
      config: 'C:\\Users\\f\\AppData\\Roaming\\deutsch-drill',
      state: 'C:\\Users\\f\\AppData\\Local\\deutsch-drill\\state',
      data: 'C:\\Users\\f\\AppData\\Local\\deutsch-drill',
    });
  });
  it('Windows falls back to the home folder', () => {
    expect(appDirs('win32', {}, 'C:\\Users\\f').config).toBe('C:\\Users\\f\\AppData\\Roaming\\deutsch-drill');
  });
  it('Linux uses XDG dirs', () => {
    expect(appDirs('linux', {}, '/home/a')).toEqual({
      config: '/home/a/.config/deutsch-drill', state: '/home/a/.local/state/deutsch-drill', data: '/home/a/.local/share/deutsch-drill',
    });
    expect(appDirs('linux', { XDG_CONFIG_HOME: '/x' }, '/home/a').config).toBe('/x/deutsch-drill');
  });
  it('env overrides win everywhere', () => {
    expect(appDirs('win32', { DEUTSCH_DRILL_CONFIG: 'D:\\cfg' }, 'C:\\Users\\f').config).toBe('D:\\cfg');
  });
});

describe('browser detection', () => {
  const winEnv = { 'ProgramFiles(x86)': 'C:\\Program Files (x86)', ProgramFiles: 'C:\\Program Files', LOCALAPPDATA: 'C:\\Users\\f\\AppData\\Local' };
  it('prefers Edge on Windows', () => {
    expect(browserCandidates('win32', winEnv)[0]).toBe('C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe');
  });
  it('falls back to Chrome on Windows when Edge is missing', () => {
    const chrome = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
    expect(findBrowser('win32', winEnv, (p) => p === chrome)).toBe(chrome);
  });
  it('finds a command on PATH on Linux', () => {
    const env = { PATH: '/usr/local/bin:/usr/bin' };
    expect(findBrowser('linux', env, (p) => p === '/usr/bin/google-chrome-stable')).toBe('/usr/bin/google-chrome-stable');
    expect(findBrowser('linux', env, () => false)).toBeNull();
  });
  it('DEUTSCH_DRILL_BROWSER wins', () => {
    expect(findBrowser('linux', { PATH: '/usr/bin', DEUTSCH_DRILL_BROWSER: 'vivaldi' }, (p) => p === '/usr/bin/vivaldi')).toBe('/usr/bin/vivaldi');
  });
  it('resolves on a Windows PATH with ; separators', () => {
    expect(resolveExecutable('msedge.exe', 'win32', { Path: 'C:\\a;C:\\b' }, (p) => p === 'C:\\b\\msedge.exe')).toBe('C:\\b\\msedge.exe');
  });
});
