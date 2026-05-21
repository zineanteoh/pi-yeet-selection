# Pi Yeet Selection

Send selected code from Cursor / VS Code to the active Pi editor with one shortcut.

## What it does

- Cursor / VS Code command: `Pi: Yeet Selection to Pi`
- Default shortcut: `Cmd+Shift+Y`
- Sends the active selection as:

```text
Look at this selected code:

src/file.ts:12-20

```ts
...
```
```

If no text is selected, it sends the current line.

## How it works

This repo has two parts:

- `packages/pi-extension`: Pi package. Starts a local-only HTTP endpoint on `127.0.0.1:17871`.
- `packages/cursor-extension`: Cursor / VS Code extension. Reads the editor selection and POSTs it to Pi.

A shared token in `~/.pi/cursor-yeet-token` protects the local endpoint.

## Local install

### Pi side

```bash
pi install /Users/zi.teoh/Desktop/pi-yeet-selection/packages/pi-extension
```

Or during development, copy/symlink `packages/pi-extension/extensions/cursor-yeet.ts` into `~/.pi/agent/extensions/` and run `/reload` in Pi.

### Cursor side

For local development, this folder is currently copied into:

```text
~/.cursor/extensions/pi-yeet-selection
```

Restart Cursor or run `Developer: Reload Window`.

## Usage

1. Start Pi and run `/reload` if needed.
2. Select code in Cursor.
3. Press `Cmd+Shift+Y`.

If Pi is not reachable, the Cursor extension copies the formatted prompt to your clipboard as a fallback.
