'use strict'
const myEmitter = require('./pubsub.js');
const settings = require('./settingsholder.js')
const rl = require('./requestloop.js')


function Clear() {
    // do something
    var txtwt100 = document.getElementById('txtwt100');
    txtwt100.innerHTML = "";
}

function Show(x) {
    // do something
    var txtwt100 = document.getElementById('txtwt100');
    txtwt100.innerHTML = x;
    setTimeout(Clear, 3000);
}

myEmitter.pubsub.on('show-nodes-section', (event, arg) => {
    var t = settings.getNode();
    var nv = document.getElementById('DropListNode');
    if(t=="") nv.selectedIndex=0;
    else nv.selectedIndex=1;
});

window.onload = function(){
let wd_btn100 = document.getElementById('wd_btn1001');
wd_btn100.addEventListener('click', (e) => {
    var nv = document.getElementById('DropListNode').value;
    e.preventDefault();
    settings.setNode(nv).then(function(){rl.refresh();});
    
    Show("Your new settings have been saved")
});
}