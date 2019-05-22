const { crashReporter, remote, webFrame, desktopCapturer, ipcRenderer } = require('electron');
const childProcess = require('child_process');
const fs = require('fs');
const os = require('os');
const timers = require('timers');
const url = require('url');


console.log(crashReporter);
console.log(remote);
console.log(webFrame);
console.log(desktopCapturer);
console.log(ipcRenderer);
console.log(childProcess);
console.log(fs);
console.log(os);
console.log(timers);
console.log(url);


remote.dialog.showMessageBox({type: 'info', message: '在渲染进程中直接使用主进程的模块'});