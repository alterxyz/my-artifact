# My Artifact — project instructions

My Artifact is one static site with one Cloudflare Worker. Each artifact is an
independent page under `/artifacts/<slug>/`. Never create a separate Cloudflare
Worker or Pages project for each HTML file.

## Source of truth

- `artifacts.json`: the published collection, titles, stable slugs, and source files or external URLs.
- `artifacts/`: self-contained HTML originals; preserve their content and interaction.
- `site/`: index template, styles, favicon, and 404 page.
- `scripts/build.mjs`: validates the manifest and creates the explicit public allowlist in `dist/`.
- `wrangler.jsonc`: configuration for the whole site, including its existing Worker name and domain.
- `LICENSING.md`, `LICENSE`, `legal/ICLA.md`: AGPL and commercial licensing boundaries.

`dist/` is generated. Do not edit it. Stale generated output is moved into ignored
`.local/stale-builds/` so removed collection entries cannot remain public. Only
`dist/` is uploaded; never deploy the project root.

## Adding an artifact

1. Inspect the supplied HTML for local dependencies, private information, and unexpected network requests.
2. Save it under `artifacts/` and add one manifest entry with `slug`, `title`,
   `description`, `category`, `format`, `added` (`YYYY-MM-DD`), and `file`.
   For a link-only item use a full HTTP(S) `url` instead of `file`.
3. Keep existing slugs stable when renaming a title. Paths are shareable permanent links.
4. Imported HTML currently needs to be self-contained. Before adding a bundle,
   extend the explicit asset allowlist for its own subdirectory; do not copy a
   broad source directory or introduce a second deployment.
5. Run `bun run check`, preview the index and new page with `bun run dev`, and
   verify desktop/mobile layout, interactions, and the return link.
6. When publication is authorized, run `bun run deploy` once for the whole site.
   Verify the deployed page and commit/push the matching public source.

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
