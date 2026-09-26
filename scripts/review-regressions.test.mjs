import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { webcrypto } from 'node:crypto';
import { Script, createContext } from 'node:vm';
import test from 'node:test';
import ts from 'typescript';

// Run actual source with isolated browser/DB boundaries: no production writes.
function loadSource(path, imports = {}, globals = {}) {
  const source = readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    fileName: path,
  });
  const exports = {};
  const context = createContext({
    exports, ...globals,
    require(name) {
      assert.ok(Object.hasOwn(imports, name), `Unexpected dependency: ${name}`);
      return imports[name];
    },
  });
  new Script(outputText, { filename: path }).runInContext(context);
  return exports;
}

const { weddingPlaylist: tracks } = loadSource('src/lib/wedding-playlist.ts');
const signature = tracks.map(track => `${track.id}:${track.src}`).join('|');

function musicHarness(initial, denyStorage = false) {
  let stored = initial;
  const played = [];
  class Audio {
    src = '';
    pause() {}
    play() { played.push(this.src); return Promise.resolve(); }
  }
  const react = {
    useMemo: fn => fn(), useCallback: fn => fn,
    useRef: current => ({ current }),
    useState: initial => [initial, () => {}],
    useEffect: effect => { effect(); },
  };
  const { useWeddingMusic } = loadSource('src/hooks/use-wedding-music.ts', {
    react, '@/lib/wedding-playlist': { weddingPlaylist: tracks },
  }, {
    Audio, URL, DOMException,
    window: {
      crypto: webcrypto, location: { href: 'https://example.test/thiep/sample' },
      localStorage: {
        getItem() { if (denyStorage) throw new Error('Storage denied'); return stored; },
        setItem(_key, value) { if (denyStorage) throw new Error('Storage denied'); stored = value; },
      },
    },
  });
  // eslint-disable-next-line react-hooks/rules-of-hooks -- Unit harness uses isolated hook primitives, not a React renderer.
  return { music: useWeddingMusic({ enabled: true, volume: .22 }), played, state: () => JSON.parse(stored) };
}

test('malformed persisted shuffle data cannot prevent playback/opening', async () => {
  for (const stored of [
    '{broken', 'null', '[]',
    JSON.stringify({ signature }),
    JSON.stringify({ signature, remainingIds: null }),
    JSON.stringify({ signature, remainingIds: {} }),
    JSON.stringify({ signature, remainingIds: 'track' }),
    JSON.stringify({ signature, remainingIds: [null, 3, tracks[0].id] }),
  ]) {
    const h = musicHarness(stored);
    await h.music.playRandom();
    assert.equal(h.played.length, 1, `playback failed for ${stored}`);
    assert.ok(tracks.some(track => track.src === h.played[0]));
    assert.ok(Array.isArray(h.state().remainingIds));
  }
});

test('a valid saved queue preserves the next track and filters duplicates/stale IDs', async () => {
  const next = tracks[2];
  const h = musicHarness(JSON.stringify({ signature, remainingIds: ['removed-track', next.id, next.id, tracks[1].id] }));
  await h.music.playRandom();
  assert.equal(h.played[0], next.src);
  assert.deepEqual(h.state().remainingIds, [tracks[1].id]);
});

test('shuffle visits every current track before repeating, including across bag boundaries', async () => {
  const h = musicHarness(null);
  for (let i = 0; i < tracks.length * 2; i++) await h.music.playRandom();
  assert.equal(new Set(h.played.slice(0, tracks.length)).size, tracks.length);
  assert.equal(new Set(h.played.slice(tracks.length)).size, tracks.length);
  assert.notEqual(h.played[tracks.length - 1], h.played[tracks.length]);
});

test('changed playlist and unavailable storage still permit playback', async () => {
  const changed = musicHarness(JSON.stringify({ signature: 'old-playlist', remainingIds: ['removed-track'] }));
  await changed.music.playRandom();
  assert.equal(changed.state().signature, signature);
  const denied = musicHarness(null, true);
  await denied.music.playRandom();
  assert.equal(denied.played.length, 1);
});

function csvRoute(rows = [], { authorized = true, error = null } = {}) {
  const query = { select() { return this; }, eq() { return this; }, order: async () => ({ data: rows, error }) };
  return loadSource('src/app/api/admin/invitations/[id]/rsvps.csv/route.ts', {
    'next/server': { NextResponse: Response },
    '@/lib/supabase': { requireAdmin: async () => authorized ? { service: { from: () => query } } : null },
  }).GET(new Request('https://example.test/export'), { params: Promise.resolve({ id: 'test-invitation' }) });
}

test('CSV neutralizes formula prefixes without modifying submitted records', async () => {
  const values = ['=1+1', '+SUM(1,2)', '-1+2', '@SUM(1,2)', '  =1+1', '\t=1+1', '\r=1+1', '\n=1+1'];
  for (const value of values) {
    const rows = [{ guest_name: value, attendance: 'yes', guest_count: 2, message: value, created_at: '2026-09-26' }];
    const response = await csvRoute(rows);
    const csv = await response.text();
    assert.ok(csv.includes(`"'${value}"`), `formula was not neutralized: ${JSON.stringify(value)}`);
    assert.equal(rows[0].guest_name, value);
    assert.equal(rows[0].message, value);
  }
});

test('CSV preserves Vietnamese, quotes, newlines, numeric count, BOM and download headers', async () => {
  const response = await csvRoute([{ guest_name: 'Hồng Thắm', attendance: 'yes', guest_count: 3, message: 'Chúc "hạnh phúc"\nTrăm năm', created_at: '2026-09-26' }]);
  const bytes = new Uint8Array(await response.arrayBuffer());
  assert.deepEqual([...bytes.slice(0, 3)], [239, 187, 191]);
  const csv = new TextDecoder().decode(bytes);
  assert.ok(csv.includes('"Hồng Thắm","Có","3","Chúc ""hạnh phúc""\nTrăm năm"'));
  assert.equal(response.headers.get('Cache-Control'), 'private, no-store');
  assert.match(response.headers.get('Content-Disposition'), /attachment;/);
});

test('CSV retains authentication and database error responses', async () => {
  assert.equal((await csvRoute([], { authorized: false })).status, 401);
  assert.equal((await csvRoute([], { error: { message: 'unavailable' } })).status, 500);
});
