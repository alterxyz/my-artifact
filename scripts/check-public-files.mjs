import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';

// Inspect Git path metadata only. Never open local keys or folder records.
const git = (...args) => execFileSync('git', args, { encoding: 'utf8' });
// Some local folder-management names are listed as SHA-256 digests, so the
// names themselves stay out of this public file. A path part is private when
// its digest, or the digest of the text after its last dot, is in the list.
const digest = value => createHash('sha256').update(value).digest('hex');
const privateNames = new Set([
  '729756f66ad38e60e38b8cd8a9c8988530b0bbf7e3e16d13fa48988d6893b4be',
  'd5a7662731aa0f2352278eb88189189d7e6210dc79e33d64eef83bd6c7c63237',
  '12d70c397d6f469e859a526ff21d09ca12c62b1579dab896329befac6561a019',
  '0f3b371f0ecd8f7efc1dc9493bfee2ed7bc77e3fc4bd77fde40ae7b868c516d3',
  '6676fdd03f975299d2afbbf73b7c2c613cff6068f90000379cbb76dcd23557a5',
]);
const forbidden = name => /^(drop-in|archive)(\/|$)/.test(name) || name.split('/').some(part =>
  part === '.local' || part.endsWith('.folder-readme')
  || privateNames.has(digest(part)) || privateNames.has(digest(part.slice(part.lastIndexOf('.') + 1))));
const inspect = (paths, label) => {
  const blocked = paths.filter(Boolean).filter(forbidden);
  if (blocked.length) throw new Error(`${label} contains private local paths:\n${blocked.join('\n')}`);
};
const inspectCommits = commits => {
  if (commits.length > 200) throw new Error('More than 200 commits; perform a bounded privacy review before publication.');
  for (const commit of new Set(commits)) {
    inspect(git('ls-tree', '-r', '--name-only', '-z', commit).split('\0'), commit.slice(0, 12));
  }
};

try {
  if (process.argv.includes('--pre-push')) {
    const lines = readFileSync(0, 'utf8').trim().split('\n').filter(Boolean);
    const seen = new Set();
    for (const line of lines) {
      const [ref, sha] = line.split(/\s+/);
      if (ref.startsWith('refs/heads/local/')) throw new Error('Local-only history branches must not be pushed.');
      if (/^0+$/.test(sha)) continue;
      // Include every unpublished commit, including files later deleted again.
      const commits = git('rev-list', '--max-count=201', sha, '--not', '--remotes=origin').trim().split('\n').filter(Boolean);
      inspectCommits(commits.filter(commit => !seen.has(commit)));
      commits.forEach(commit => seen.add(commit));
    }
    console.log('Public-path check passed for unpublished history.');
  } else {
    inspect(git('ls-files', '--cached', '-z').split('\0'), 'Git index');
    if (process.argv.includes('--ci-history')) {
      const head = process.env.HEAD_REV;
      const base = process.env.BASE_REV;
      if (!/^[0-9a-f]{40}$/.test(head ?? '')) throw new Error('Missing or invalid CI head revision.');
      if (base && !/^[0-9a-f]{40}$/.test(base)) throw new Error('Invalid CI base revision.');
      // Manual runs without a base inspect HEAD; push/PR runs inspect the full
      // newly introduced range. A new branch has an all-zero base.
      const args = !base ? ['--max-count=1', head]
        : ['--max-count=201', head, ...(/^0+$/.test(base) ? [] : [`^${base}`])];
      inspectCommits(git('rev-list', ...args).trim().split('\n').filter(Boolean));
      console.log('Public-path check passed for the CI commit range.');
    }
    console.log('Public-path check passed for the Git index.');
  }
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
