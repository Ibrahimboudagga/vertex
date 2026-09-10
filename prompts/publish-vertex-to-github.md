# Publish Vertex to a public GitHub repository

## Goal

Create a new public GitHub repository named `vertex`, publish the complete current project to it, and include a clear project description plus the technologies currently used.

## Guidance and code inspected

- `AGENTS.md`
- `plugin-management` skill (GitHub is an external account capability)
- `package.json`, `.gitignore`, and README presence
- Git is installed, but this directory is not yet a Git repository.
- GitHub CLI is not installed on this machine, so repository creation/authentication must use the authenticated GitHub website if available.

## Decisions and assumptions

- Repository visibility: public, as requested.
- Repository name: `vertex`, matching the project package name.
- Description: `An AI-powered learning platform with Sanity-managed courses, Clerk authentication, and in-site lesson video playback.`
- Initialize Git with `main` as the default branch.
- Update `.gitignore` to exclude `.next`, all local environment files, and other generated artifacts; keep `.env.example` tracked.
- Replace or update the README with an accurate Vertex overview, setup instructions, features, and technology list derived from `package.json` and the implemented project.
- Commit only project source, configuration, prompts, and documentation. Do not commit `.env.local`, node_modules, build output, tokens, or user-local data.
- Create the GitHub repository and push `main` using the authenticated GitHub web session if available. If sign-in or multi-factor authentication is required, pause for the user to complete it.

## Expected files

- `README.md`
- `.gitignore`
- `.git/` (new local Git metadata)
- GitHub repository `vertex` (new public external resource)
- `prompts/publish-vertex-to-github.md` (this prompt)

## Security

- Inspect tracked files before the first commit.
- Verify no files matching `.env*` other than `.env.example` are staged.
- Never expose or commit Clerk or Sanity credentials.

## Acceptance criteria

- A public GitHub repository named `vertex` exists under the authenticated account.
- Its description matches the project purpose.
- The repository contains the current project on the `main` branch.
- README documents the project and its actual technologies.
- The remote URL and clean working-tree status are verified after push.

## Checks

1. Inspect `git status --short` before commit.
2. Inspect staged paths to confirm secrets/build artifacts are absent.
3. Push `main` to GitHub.
4. Verify the remote URL and final `git status --short --branch`.
