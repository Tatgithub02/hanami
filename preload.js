// Hanami - preload bridge
// Safely exposes two things to the page:
//   window.HANAMI_INIT  - the saved data read from disk at startup (or null)
//   window.hanamiAPI    - save() and notify(), routed to the main process
// contextIsolation is on, so the page cannot touch Node directly; only these.

const { contextBridge, ipcRenderer } = require("electron");

let init = null;
try {
  init = ipcRenderer.sendSync("get-init"); // synchronous: data is ready before the page boots
} catch (e) {
  init = null;
}

contextBridge.exposeInMainWorld("HANAMI_INIT", init);

contextBridge.exposeInMainWorld("hanamiAPI", {
  save: (data) => {
    try { ipcRenderer.send("save", data); } catch (e) {}
  },
  notify: (title, body) => {
    try { ipcRenderer.send("notify", { title, body }); } catch (e) {}
  }
});
