// Hanami - Electron main process
// Owns the window, the tray, durable file storage, and native notifications
// that fire even when the window is hidden or minimised.

const { app, BrowserWindow, Tray, Menu, Notification, ipcMain, nativeImage } = require("electron");
const path = require("path");
const fs = require("fs");

// ---- durable storage: a real JSON file on disk -------------------------------
// Lives at  %APPDATA%\Hanami\hanami-data.json  on Windows.
// This is your data. Back it up by copying that file.
const DATA_FILE = path.join(app.getPath("userData"), "hanami-data.json");

function readData() {
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
  } catch (e) {
    return null; // first run, or unreadable: renderer will seed fresh
  }
}

let writeTimer = null;
let pending = null;
function writeData(data) {
  pending = data;
  if (writeTimer) return;
  writeTimer = setTimeout(() => {
    try {
      // write to a temp file then rename, so a crash mid-write never corrupts the real file
      const tmp = DATA_FILE + ".tmp";
      fs.writeFileSync(tmp, JSON.stringify(pending));
      fs.renameSync(tmp, DATA_FILE);
    } catch (e) {
      // best effort: a failed save must never crash the app
    }
    writeTimer = null;
  }, 400);
}

// preload asks for the saved data synchronously at startup
ipcMain.on("get-init", (e) => { e.returnValue = readData(); });
// renderer pushes the whole state whenever it changes
ipcMain.on("save", (e, data) => writeData(data));
// renderer asks for a native OS notification (works while hidden)
ipcMain.on("notify", (e, { title, body }) => {
  if (Notification.isSupported()) {
    const n = new Notification({ title: title || "Hanami", body: body || "", silent: false });
    n.on("click", () => { if (win) { win.show(); win.focus(); } });
    n.show();
  }
});

// ---- window + tray -----------------------------------------------------------
let win = null;
let tray = null;
let quitting = false;

function iconImage() {
  const p = path.join(__dirname, "assets", "icon.png");
  const img = nativeImage.createFromPath(p);
  return img.isEmpty() ? null : img;
}

function createWindow() {
  const icon = iconImage();
  win = new BrowserWindow({
    width: 1240,
    height: 800,
    minWidth: 900,
    minHeight: 560,
    title: "Hanami",
    backgroundColor: "#160f13",
    icon: icon || undefined,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false
    }
  });
  win.setMenuBarVisibility(false);
  win.loadFile(path.join(__dirname, "renderer", "index.html"));

  // Closing the window hides it to the tray instead of quitting,
  // so timers and scheduled nudges keep running in the background.
  win.on("close", (e) => {
    if (!quitting) {
      e.preventDefault();
      win.hide();
    }
  });
}

function createTray() {
  const icon = iconImage();
  tray = new Tray(icon || nativeImage.createEmpty());
  const menu = Menu.buildFromTemplate([
    { label: "Open Hanami", click: () => { if (win) { win.show(); win.focus(); } } },
    {
      type: "checkbox",
      label: "Start with Windows",
      checked: app.getLoginItemSettings().openAtLogin,
      click: (item) => app.setLoginItemSettings({ openAtLogin: item.checked })
    },
    { type: "separator" },
    { label: "Quit Hanami", click: () => { quitting = true; app.quit(); } }
  ]);
  tray.setToolTip("Hanami");
  tray.setContextMenu(menu);
  tray.on("click", () => {
    if (win) { win.isVisible() ? win.focus() : win.show(); }
  });
}

// ---- single instance, lifecycle ---------------------------------------------
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on("second-instance", () => { if (win) { win.show(); win.focus(); } });

  app.whenReady().then(() => {
    createWindow();
    createTray();
    // Launch at login by default. Turn off any time from the tray menu.
    app.setLoginItemSettings({ openAtLogin: true });

    app.on("activate", () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
      else if (win) win.show();
    });
  });

  // Do nothing here: we keep running in the tray after the window closes.
  app.on("window-all-closed", () => {});
  app.on("before-quit", () => { quitting = true; });
}
