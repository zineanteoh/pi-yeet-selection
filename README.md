# Pi Yeet Selection

Yeet highlighted code from your IDE (Cursor) to Pi with one shortcut (CMD+SHIFT+Y)

## Install

Run this once:

```
pi install git:github.com/zineanteoh/pi-yeet-selection
```

Restart Pi, or run this inside Pi:

```
/reload
```

Then ask Pi to install the pi-yeet-selection Cursor extension for you:

```
/cursor-yeet-install-cursor
```

Restart Cursor.

If Cursor is already open, run this from the command palette:

```
Developer: Reload Window
```

Start yeeting code from IDE to [pi.dev](http://pi.dev) terminal

## Use it

1. Start Pi.
2. Open Cursor.
3. Highlight code.
4. Press Cmd+Shift+Y.

If you do not select anything, it sends the current line.

## Commands

Cursor command palette:

- Pi: Yeet Selection to Pi
- Pi: Copy Selection Prompt

Pi commands:

- /cursor-yeet-install-cursor
- /cursor-yeet-status

Default shortcut:

- Cmd+Shift+Y

## What gets sent

Pi receives the file path, line numbers, and selected code.

Example:

```
Look at this selected code:

src/example.ts:12-20

selected code here
```

## Notes

- Everything runs locally on your machine.
- The Pi side listens on 127.0.0.1 only.
- A local token at ~/.pi/cursor-yeet-token protects the endpoint.

