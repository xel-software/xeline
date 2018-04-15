'use strict'
const myEmitter = require('./pubsub.js');
const settings = require('./settingsholder.js')
const qr = require('qr-image');
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

    let buffers = [];

    qr.image(text, {
      format: 'svg',
      size: 10
    })
      .on('data', buffer => buffers.push(buffer))
      .on('end', _ => {

        let buffer = Buffer.concat(buffers);
        let dataUri = `data:image/svg;base64,${buffer.toString('base64')}`;
        resolve(dataUri);
      })
      .on('error', reject);
  });
}

myEmitter.pubsub.on('show-deposit-section', (event, arg) => {
  console.log("About IPC fired.");
  const st = settings.getKey();
  document.getElementById("acc_id").innerHTML = st["id"];
  document.getElementById("acc_rs").innerHTML = st["reed"];
  createQRPNGBase64(st["reed"]).then(dataUri => img.src = dataUri);
})

