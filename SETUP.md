# Hanami — Windows setup

This is the full source of your Hanami desktop app. You run two or three commands
once, and you get a real installed Windows app with:

- notifications that reach you even when the window is hidden or minimised
- your data saved to a real file on disk (not just a browser)
- a tray icon, so it keeps running in the background
- start-with-Windows (on by default; toggle it from the tray menu)

Nothing here phones home. The app runs entirely on your machine.

---

## One-time: install Node.js

If you don't already have it, install Node.js LTS from https://nodejs.org
(the big green "LTS" button). Accept the defaults. This gives you `node` and `npm`.

To check it worked, open **PowerShell** and run:

    node --version
    npm --version

Both should print a version number.

---

## Step 1 — open PowerShell in this folder

Unzip this folder somewhere you'll keep it (e.g. `C:\Users\<you>\Hanami`).
Then open it in PowerShell: in File Explorer, go into the `hanami-app` folder,
click the address bar, type `powershell`, and press Enter.

## Step 2 — install the dependencies

    npm install

This downloads Electron and the builder (a few hundred MB, one time). Wait for it
to finish.

## Step 3a — run it right now (to try it)

    npm start

Hanami opens. This is "dev" mode: it runs from the source without installing.
Close the window and it drops to the tray; right-click the tray icon to quit.

## Step 3b — build the installer (to install it properly)

    npm run dist

When it finishes, look in the new `dist` folder. You'll find:

    Hanami Setup 1.0.0.exe

Run that to install Hanami like any normal app. It creates a Start-menu and
desktop shortcut, and (by default) launches at login.

---

## About the Windows warning (this is expected)

The installer is **not code-signed**, because a signing certificate costs money and
is tied to a registered developer identity. So the first time you run it, Windows
SmartScreen will show a blue "Windows protected your PC" box.

This is Windows' normal behaviour for any unsigned app, not a sign anything is
wrong. To proceed: click **More info**, then **Run anyway**.

If you ever want to remove that warning, the only real fix is buying a code-signing
certificate (an OV certificate, a few hundred USD/year, from a CA like Sectigo or
DigiCert) and signing the build. That's optional and entirely separate from the app
working.

---

## Where your data lives

Everything you do in Hanami is saved to:

    %APPDATA%\Hanami\hanami-data.json

Paste that path into the File Explorer address bar to find it. **To back up your
data, copy that one file.** To move Hanami to another PC, copy it into the same
location there. (The in-app "copy backup" button copies the same data to your
clipboard as a second option.)

---

## Turning start-with-Windows on or off

Right-click the tray icon → "Start with Windows" is a checkbox. Toggle it any time.

---

## If something goes wrong

- `npm` not recognised → Node.js isn't installed, or PowerShell needs reopening
  after installing it.
- `npm install` fails on a slow or restricted network → try again; it resumes.
- The build fails → run `npm start` instead; dev mode doesn't need the builder and
  confirms the app itself works. Then send me the error text from `npm run dist`.
