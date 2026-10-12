import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync, writeFileSync, mkdtempSync, rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';

const root = new URL('../', import.meta.url);
const workflow = readFileSync(new URL('.github/workflows/bump-lunea-loader-413.yml', root), 'utf8');

test('release stamps fixed and nested prompt loaders without changing their runtime logic', () => {
  const start = workflow.indexOf("          python - <<'PY'\n");
  const end = workflow.indexOf('\n          PY', start);
  assert.ok(start >= 0 && end > start, 'release Python block exists');
  const script = workflow.slice(start + "          python - <<'PY'\n".length, end)
    .split('\n').map(line => line.startsWith('          ') ? line.slice(10) : line).join('\n');
  const dir = mkdtempSync(join(tmpdir(), 'lunea-release-test-'));
  const files = ['index.html', 'lunea-structural-routing-v4.js', 'lunea-boot-reveal-v29.js', 'lunea-astro-origin-failover-v57.js'];
  const build = 'abcdef123456';
  try {
    for (const file of files) writeFileSync(join(dir, file), readFileSync(new URL(file, root)));
    const result = spawnSync('python3', ['-c', script], {cwd:dir, env:{...process.env, GITHUB_SHA:build + '0000000000000000000000000000'}, encoding:'utf8'});
    assert.equal(result.status, 0, result.stderr || result.stdout);
    assert.equal(JSON.parse(readFileSync(join(dir, 'lunea-build.json'), 'utf8')).version, build);
    const targets = {
      'index.html': ['timing-oracle-v1.js', 'lunea-cache-refresh-v1.js', 'lunea-structural-routing-v4.js'],
      'lunea-structural-routing-v4.js': ['lunea-final-prompt-priority-v1.js', 'lunea-fixed-spread-depth-v30.js', 'lunea-intimacy-v34.js', 'lunea-intimacy-legacy-v35.js', 'lunea-intimacy-ai-bridge-v34.js', 'lunea-thai-range-v33.js', 'lunea-timing-ab-inline-v16.js', 'lunea-timing-prompt-repair-v1.js', 'lunea-message-oracle-support-v1.js'],
      'lunea-boot-reveal-v29.js': ['lunea-daily-interpretation-contract-v2.js'],
      'lunea-astro-origin-failover-v57.js': ['lunea-horary-post-actions-v44.js', 'lunea-horary-ai-guard-v49.js']
    };
    for (const [file, assets] of Object.entries(targets)) {
      const updated = readFileSync(join(dir, file), 'utf8');
      for (const asset of assets) {
        const pattern = new RegExp(asset.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\?v=([^"\x27]+)', 'g');
        const keys = [...updated.matchAll(pattern)].map(match => match[1]);
        assert.ok(keys.length > 0, `${file}: ${asset} appears`);
        assert.ok(keys.every(key => key === build), `${file}: ${asset} uses new build`);
      }
      if (file !== 'index.html') {
        const normalize = source => source.replace(/\?v=[^"\x27]+/g, '?v=BUILD');
        assert.equal(normalize(updated), normalize(readFileSync(new URL(file, root), 'utf8')), 'release only changes URL keys');
      }
    }
    assert.match(workflow, /group: lunea-build-cache\s+cancel-in-progress: false/);
    assert.match(workflow, /ref: main/);
  } finally { rmSync(dir, {recursive:true, force:true}); }
});
