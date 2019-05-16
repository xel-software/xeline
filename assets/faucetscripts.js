'use strict'
const https = require('http');
const settings = require('./settingsholder.js')
const myEmitter = require('./pubsub.js');
const requestloop = require('./requestloop.js')

let text = document.getElementById('faucet');
let faucet_btn = document.getElementById('faucet_btn');

myEmitter.pubsub.on('show-faucet-section', (event, arg) => {
    text.innerHTML = "";

});

faucet_btn.addEventListener('click', () => {
  const st = settings.getKey();
  const testnet = settings.getIsTestnet();
  const port = ((testnet) ? 16876 : 17876);
  const fip = "faucet.xel.org";
  var fauceturl = 'http://' + fip + ":" + ((testnet) ? "16876" : "17876") + "/nxt";

  //faucet_btn.style.opacity=0.3;
  faucet_btn.disabled = true;
  text.innerHTML="<span class='double-bounce1' id='bouncer1'></span><span class='double-bounce2' id='bouncer2'></span> <span id='faucet'>Hang tight, we are contacting the faucet ...</span>";
  console.log("Asking: " + fauceturl + '?requestType=faucet&account=' + st["id"]);
  https.get(fauceturl + '?requestType=faucet&account=' + st["id"], (resp) => {
  let data = '';

  resp.on('data', (chunk) => {
    data += chunk;
  });

  resp.on('end', () => {
    //faucet_btn.style.opacity=1;
    faucet_btn.disabled = false;
    var resp = JSON.parse(data);
    if("errorDescription" in resp){
        text.innerHTML="An error occured: " + resp["errorDescription"];
        faucet_btn.disabled = false;
    }
    else if("successMessage" in resp){
        text.innerHTML=resp["successMessage"];
        faucet_btn.disabled = false;
    }else{
        text.innerHTML="An error occured: the faucet replied something we did not understand";
        faucet_btn.disabled = false;
    }

  });

}).on("error", (err) => {
    text.innerHTML="An error occured: the faucet could not be reached";
    //faucet_btn.style.opacity=1;
    faucet_btn.disabled = false;
});
})
