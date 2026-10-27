# Contributing

Small fixes can be sent directly as pull requests. Discuss larger changes in an
issue first. Keep the project buildless at runtime and avoid adding services or
dependencies without a concrete need.

## Contributor license agreement

Before an external contribution is merged, its contributor must read
[legal/ICLA.md](legal/ICLA.md) and sign by posting this exact comment on their pull
request:

> I have read the CLA Document and I hereby sign the CLA

The maintainer reviews the comment and records acceptance in that pull request.
There is no CLA bot. Do not merge an unsigned external contribution. Contributors
keep ownership of their work; the ICLA grants the project steward the rights
needed to offer AGPL and separate commercial licensing.

Identify third-party material and its license. Disclose substantive AI assistance
in the pull request description, and verify the submitted material's correctness
and license compatibility. A submitted issue or pull request is not a signature
by itself.

## Validation

Run `bun install --frozen-lockfile` and `bun run check`. For visible changes,
inspect the homepage and an artifact on desktop and mobile. The CI workflow runs
the same build and Cloudflare dry run without deployment credentials.
