# My Artifact — project instructions

My Artifact is one static site with one Cloudflare Worker. Each artifact is an
independent page under `/artifacts/<slug>/`. Never create a separate Cloudflare
Worker or Pages project for each HTML file.

## Source of truth

- `artifacts.json`: the published collection, titles, stable slugs, and source files or external URLs.
- `drop-in/`: private, Git-ignored inbox for incoming material; covered by local Regent ensure rules.
- `archive/`: private, Git-ignored home for cleaned, organized work retained without publication; also ensured.
- `artifacts/`: approved public HTML source; preserve its content and interaction.
- `site/`: index template, styles, favicon, and 404 page.
- `scripts/build.mjs`: validates the manifest and creates the explicit public allowlist in `dist/`.
- `wrangler.jsonc`: configuration for the whole site, including its existing Worker name and domain.
- `LICENSING.md`, `LICENSE`, `legal/ICLA.md`: AGPL and commercial licensing boundaries.

`dist/` is generated. Do not edit it. Stale generated output is moved into ignored
`.local/stale-builds/` so removed collection entries cannot remain public. Only
`dist/` is uploaded; never deploy the project root.

## Adding an artifact

1. Receive unreviewed material in `drop-in/`. Placement in the inbox is not
   publication permission. Inspect the specified material for local dependencies,
   private information, and unexpected network requests before processing it.
2. After privacy review or sanitization, choose one canonical destination:
   move retained work into `archive/`, or move work approved for public release
   directly into `artifacts/`. Do not keep an identical second copy in the other
   directory. When publishing a previously archived item, move it from the archive.
   If material cannot be made privacy-safe, leave it in the private inbox and report
   the unresolved issue. Do not silently publish it or discard it.
3. For a public item, add one manifest entry with `slug`, `title`,
   `description`, `category`, `format`, `added` (`YYYY-MM-DD`), and `file`.
   For a link-only item use a full HTTP(S) `url` instead of `file`.
   Optional card covers use `cover` (a local image inside `artifacts/`) and a
   descriptive `cover_alt`. Only the explicitly listed image is copied to the
   public build; the same path and symlink restrictions as HTML apply.
4. Keep existing slugs stable when renaming a title. Paths are shareable permanent links.
   Append new entries to the manifest. The homepage sorts by `added` descending;
   for equal dates, later manifest entries appear first.
5. Imported HTML currently needs to be self-contained. Before adding a bundle,
   extend the explicit asset allowlist for its own subdirectory; do not copy a
   broad source directory or introduce a second deployment.
6. Run `bun run check`, preview the index and new page with `bun run dev`, and
   verify desktop/mobile layout, interactions, and the return link.
7. When publication is authorized, run `bun run deploy` once for the whole site.
   Verify the deployed page and commit/push the matching public source.

The inbox and archive are not Git or website content. Their local Regent board
must ensure both subtrees; Git ignore is not a backup policy. Board identities,
receipts, and other local storage configuration stay in ignored local metadata.
If a rule change invalidates an in-flight backup task, use the normal Regent
task workflow and report the actual state; do not bypass locks or claim backup
completion from an ensure setting alone.

The build only accepts local files inside the real `artifacts/` directory and
rejects links escaping it. Never point the public manifest at the inbox or archive.
`dist/` is regenerable deployment output. Its generated copies are not archival
masters; do not use it as a second permanent copy of finished work.

## Build, deployment, and GitHub

- Install reproducibly with `bun install --frozen-lockfile`.
- `bun run check` builds and runs a Cloudflare deployment dry run.
- `bun run dev` starts a local preview.
- `bun run deploy` builds and updates the existing whole-site Worker.
- GitHub Actions checks pushes and pull requests. It does not publish to
  Cloudflare. Do not claim that a Git push alone deploys the site.
- Do not put Cloudflare credentials or account IDs in shared project files.
  Wrangler uses its local login; automation credentials must remain in the
  selected platform's secret storage.
- Before publishing, review the staged files and the history being pushed.
  Keep local deployment records, backups, and folder-management metadata private.
- Run `bun run setup-hooks` once in a new clone. The pre-push hook checks every
  unpublished commit for private folder paths, even if a file was later removed,
  and blocks `local/` history branches. Do not bypass it with `--no-verify`.
- Preserve existing work and deployment identity. Do not deploy an unrelated
  service or change the blog's domain.

## Scope and licensing

Keep the site a simple static collection. No database, per-page services, or
runtime framework is needed for this use case. Add a server only when a concrete
feature requires it.

The default license is AGPL-3.0-or-later, with separately negotiated commercial
licensing available from the project steward. Do not describe AGPL as banning
commercial use. Keep source/license links available in the generated pages.
External contributions require the manual ICLA process in `CONTRIBUTING.md`
before merging; never sign on behalf of a contributor.
