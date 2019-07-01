const {app, dialog, ipcMain} = require("electron");
const Client = require('bitcoin-core');
const adeptiod = require('./aderpc.js');
const child_process = require("child_process");
const appRoot = require("app-root-path");
const path = require("path");
const fs = require("fs");
const os = require("os");

class Daemon {
  constructor() {
    this.isRunning = false;
    this.gethProcess = null;

    if (appRoot.path.indexOf("app.asar") > -1) {
      this.rootPath = path.dirname(appRoot.path);
    } else {
      this.rootPath = appRoot.path;
    }

    switch (os.type()) {
      case "Windows_NT":
        this.binaries = path.join(this.rootPath, "bin", "windows");
        this.daemon = "adeptiod.exe";
        this.daemonstop = "adeptiod-cli.exe";
        break;
      case "Linux":
        this.binaries = path.join(this.rootPath, "bin", "linux");
        this.daemon = "adeptiod";
        this.daemonstop = "adeptio-cli";
        break;
      case "Darwin":
        this.binaries = path.join(this.rootPath, "bin", "macos");
        this.daemon = "adeptiod"; 
        this.daemonstop = "adeptiod-cli";       
        break;
      default:
        this.binaries = path.join(this.rootPath, "bin", "windows");
        this.daemon = "adeptiod.exe";
        this.daemonstop = "adeptio-cli.exe";
    }
  }

  startDaemon() {

    // Check if user specified another dir
    var userSpecifiedHomeDir
    fs.readFile(process.resourcesPath+"/apidata/userSpecifiedDataDir.json", 'utf8', function (err, data) {
      if (data === undefined) {
        userSpecifiedHomeDir = "";
     } else {
         userSpecifiedHomeDir = "\"--datadir\=" + data + "/\",";
    }   
})

    // get the path of get and execute the child process
    try {
      this.isRunning = true;
      const daemonPath = path.join(this.binaries, this.daemon);
      this.daemonProcess = child_process.spawn(daemonPath, [
        "--daemon",
        "--rpcuser=adeptio",
        "--rpcpassword=",
        "--staking=1",
        "--rpcallowip=127.0.0.1",
        //userSpecifiedHomeDir
      ]);

      if (!this.daemonProcess) {
        dialog.showErrorBox("Error starting application", "Daemon failed to start! Error code 1");
        app.quit();
      } else {
        this.daemonProcess.on("error", function (err) {
          dialog.showErrorBox("Error starting application", "Daemon failed to start! Error code 2"+err);
          app.quit();
        });
        this.daemonProcess.on("close", function (err) {
          if (this.isRunning) {
            dialog.showErrorBox("Error running the node", "The node stoped working. Wallet will close!"+err);
            app.quit();
          }
        });
      }
    } catch (err) {
      dialog.showErrorBox("Error starting application", err.message);
      app.quit();
    } 
}

  stopDaemon() {
    this.isRunning = false;

    if (os.type() == "Windows_NT") {
      const gethPath = path.join(this.binaries, this.daemonstop);
      const daemonPath = path.join(this.binaries, this.daemon);
      this.daemonProcess = child_process.spawn(daemonPath, [
        "stop"
      ]);
    } else {
      const daemonPath = path.join(this.binaries, this.daemonstop);
      this.daemonProcess = child_process.spawn(daemonPath, [
        "stop"
        ]);
    }
  }
}

AdeptioDaemon = new Daemon();

