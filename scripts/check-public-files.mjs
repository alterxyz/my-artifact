import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

// Inspect Git path metadata only. Never open local keys or folder records.
const git = (...args) => execFileSync('git', args, { encoding: 'utf8' });
const forbidden = name => name.split('/').some(part =>
  ['regent-consulate', 'office-of-regent-managed-folder', '.regent-of-folders', '.local', 'regent-managed-folder.md'].includes(part)
  || part.endsWith('.regent-managed-folder') || part.endsWith('.folder-readme'));
const inspect = (paths, label) => {
  const blocked = paths.filter(Boolean).filter(forbidden);
  if (blocked.length) throw new Error(`${label} contains private local paths:\n${blocked.join('\n')}`);
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
      if (commits.length > 200) throw new Error('More than 200 unpublished commits; perform a bounded privacy review before pushing.');
      for (const commit of commits) {
        if (seen.has(commit)) continue;
        seen.add(commit);
        inspect(git('ls-tree', '-r', '--name-only', '-z', commit).split('\0'), commit.slice(0, 12));
      }
    }
    console.log('Public-path check passed for unpublished history.');
  } else {
    inspect(git('ls-files', '--cached', '-z').split('\0'), 'Git index');
    console.log('Public-path check passed for the Git index.');
  }
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
