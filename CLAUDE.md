# Project Notes

## Current State

- This is a React + Vite app for weight tracking and habit consistency.
- Git is initialized locally and connected to GitHub.
- Remote repository: `https://github.com/VanDree1/lean-app`
- Default branch: `main`
- Shared Claude settings live in `.claude/settings.json`
- Local machine-specific Claude settings live in `.claude/settings.local.json` and are ignored by Git

## Recent Work

- Fixed lint issues in the app so the project now passes:
  - `npm run lint`
  - `npm run build`
- Added Git and GitHub setup for the project
- Added shared Claude configuration for repo-friendly use

## Important Files

- `src/App.jsx`
- `src/pages/Home.jsx`
- `src/components/Onboarding/`
- `src/components/Weight/`
- `.claude/settings.json`

## How To Continue

When starting a new Claude Code session in this repo:

1. Read repo status and recent commits
2. Read this file before making assumptions
3. Prefer continuing from the current app structure instead of resetting or replacing it
4. Run `npm run lint` and `npm run build` after substantial changes

## Suggested Start Prompt

`Read CLAUDE.md, inspect git status and recent commits, then continue from the current state of the app.`
