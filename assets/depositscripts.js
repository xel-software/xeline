'use strict'
const myEmitter = require('./pubsub.js');
const settings = require('./settingsholder.js')
const QRCode = require('qrcode')
const fs = require('fs');
const {clipboard} = require('electron')

const copyBtn = document.getElementById('copy-to-id')
const copyBtnRs = document.getElementById('copy-to-rs')

let img = document.getElementById('img-qr');


copyBtn.addEventListener('click', () => {
  const st = settings.getKey();
  clipboard.writeText(st["id"]);
})

copyBtnRs.addEventListener('click', () => {
  const st = settings.getKey();
  clipboard.writeText(st["reed"]);
})

/**
 * Create QR image data in data URI.
 */
function createQRPNGBase64(text) {
  return new Promise((resolve, reject) => {

    var opt = {'color':{'light':'#0d112cff','dark':'#ffffffff'}, "width":256};
    QRCode.toDataURL(text, opt, function (err, url) {
      resolve(url);
    });
  });
}

myEmitter.pubsub.on('show-deposit-section', (event, arg) => {
  console.log("About IPC fired.");
  const st = settings.getKey();
  document.getElementById("acc_id").innerHTML = st["id"];
  document.getElementById("acc_rs").innerHTML = st["reed"];
  createQRPNGBase64(st["reed"]).then(dataUri => img.src = dataUri);
})

