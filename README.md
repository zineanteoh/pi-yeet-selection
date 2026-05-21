# Pi Yeet Selection

Yeet highlighted code from your IDE (Cursor) to Pi with one shortcut (CMD+SHIFT+Y)

https://github.com/user-attachments/assets/79bf9e46-fa5a-4cc5-aae7-dbb07051a6da

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

Go to Cursor, run CMD+SHIFT+P to open the command palette, then run:

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
