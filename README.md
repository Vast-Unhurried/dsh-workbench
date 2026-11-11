# Workbench

`@local/dsh-workbench` is the Workbench plugin for the DeepSeek Harness Web GUI. It adds a sidebar page and a matching Settings section that together work as a private shelf of configured volumes for everyday, non-coding work.

Each board is a real DSH Session that carries its own fixed prompts, skill selections, remembered model and reasoning choices, and working area, so returning to a board costs one click and no re-briefing. Boards can be nested as sub-boards; conversation, to-do and note boards share the same durable document.

## What it owns

- The Workbench page and its sidebar entry: cloth covers, a row of mini cover fronts, an inner page and a today drawer.
- Boards and sub-boards: create, rename, reorder, delete, and per-board configuration.
- Per-board working areas: the first conversation registers the board's working area as a DSH Workspace (idempotently) so the shell can open its Sessions directly instead of showing the workspace chooser; a board may override the document's default path.
- Per-board prompts (multi-select) and skills, remembered model and reasoning choices, and a validated working-area directory.
- To-dos with priority, due day, search, filters and minute-accurate reminders (frame-wide toast plus optional desktop notification).
- Notes in two blocks (`spark` / `note`) with tags, pinning, search and copy.
- A Workbench section in Settings for board structure, working areas and the prompt library.
- The Host routes `/workbench/api/{state,workspace,skills}` and the bundled fonts under `/workbench/fonts`.

## What it does not own

- The global appearance. The Workbench uses the shell's native `--dsw-*` tokens; install the `@local/dsh-appearance-boot` bundle for the system-wide appearance skin.
- The conversation transcript, composer, model selector or permission seat. Those belong to the shipped session UI; the Workbench only stores what a new conversation on a board should inherit.

## Requirements

DeepSeek Harness 0.2.2-rc.1 (Cordis 4.1) or a compatible build.

## Install

The package is not published to npm. Add the repository as a link dependency in a DSH profile and include it in `dsh.profile.bundles`:

```json
{
  "dependencies": {
    "@local/dsh-workbench": "link:/path/to/dsh-workbench"
  },
  "dsh": {
    "profile": {
      "bundles": ["@local/dsh-workbench"]
    }
  }
}
```

The plugin's `cordis.patch.yml` inserts its own bundle row plus the `workbench-chat` agent preset.

## Files

| File | Role |
|---|---|
| `index.js` | Host half: durable document, skill catalog, working areas, per-Session instructions and fonts. |
| `client.js` | Built client half: sidebar panel, shelf page, to-do and note surfaces, Settings section. |
| `cordis.patch.yml` | Bundle rows for the plugin and the plain-chat agent preset. |
| `locale/*.json` | Chinese and English metadata. |
| `fonts/**` | Self-hosted IBM Plex Sans / IBM Plex Mono / Noto Sans SC. |
