'use strict'
const myEmitter = require('./pubsub.js');
const settings = require('./settingsholder.js')
myEmitter.pubsub.on('show-about-modal', (event, arg) => {
    console.log("About IPC fired.");
    document.getElementById("mnemonic").innerHTML = settings.getKey()["mnemonic"];
    let ggg = document.getElementById('get-started');


ggg.addEventListener('click', () => {
    settings.setAbout();
    console.log("CONFIRMED ABOUT");
});

})
