'use strict'
const myEmitter = require('./pubsub.js');
const settings = require('./settingsholder.js')
const https = require('http');
const requestloop = require('./requestloop.js')
const nxt = require('nxtjs');
let adr = document.getElementById('adr');
let amt = document.getElementById('amt');
let terms = document.getElementById('terms');
let wd_btn = document.getElementById('wd_btn');

let textwd = document.getElementById('txtwt');

myEmitter.pubsub.on('show-withdraw-section', (event, arg) => {
    adr.value="";
    amt.value="";
    textwd.innerHTML = "";
    terms.checked=false;
});
  

wd_btn.addEventListener('click', (e) => {
    e.preventDefault();
    const st = settings.getKey();

    if(terms.checked==false){
        textwd.innerHTML="You have to accept the terms before you can withdraw any coins";
        return;
    }

    var amnt = amt.innerHTML;
    var reeddec = "0";

    if (!/XEL\-....\-....\-....\-...../i.test(adr.value)) {
        textwd.innerHTML="You have entered an invalid recipient address";
        return;
    }

    if(amt==""){
        textwd.innerHTML="You have to enter an amount";
        return;
    }
    try{
        amnt = requestloop.formatNQT(amt.value);
        reeddec = nxt.rsConvert(adr.value.replace("XEL","NXT"))["account"]; // this is the only exception

        if(reeddec=="0" || reeddec == undefined){
            textwd.innerHTML="You have entered an invalid recipient address";
            return;
        }
    }catch(e){
        console.log(e);
        textwd.innerHTML="You have entered an invalid amount or an invalid recipient address";
        return;
    }
  
    //faucet_btn.style.opacity=0.3;
    wd_btn.disabled = true;
    adr.disabled = true;
    amt.disabled = true;
    terms.disabled = true;

    textwd.innerHTML="<span class='double-bounce1' id='bouncer1'></span><span class='double-bounce2' id='bouncer2'></span> <span id='faucet'>Hang tight, we are processing your withdrawal ...</span>";
    var urlx = requestloop.getrpcurl() + '?requestType=sendMoney&publicKey=' +  settings.toHexString(st["pub"]) + '&recipient=' + reeddec + "&deadline=64&feeNQT=10000000&amountNQT=" + amnt;
    var urlx2 = requestloop.getrpcurl() + '?requestType=sendTransaction';

    console.log("Withdraw URL: " + urlx);
    https.get(urlx, (resp) => {
    let data = '';
  
    resp.on('data', (chunk) => {
      data += chunk;
    });
  
    resp.on('end', () => {
      //faucet_btn.style.opacity=1;
      /*wd_btn.disabled = false;
      adr.disabled = false;
      amt.disabled = false;
      terms.disabled = false;*/
      var resp = JSON.parse(data);
      if("errorDescription" in resp){
        textwd.innerHTML="An error occured: " + resp["errorDescription"];
          wd_btn.disabled = false;
        adr.disabled = false;
        amt.disabled = false;
        terms.disabled = false;
      }
      else if("unsignedTransactionBytes" in resp){
        var ub = resp["unsignedTransactionBytes"];
        var stx = nxt.signTransactionBytes(ub, st["mnemonic"]);
          console.log("Calling: " + urlx2 + "&transactionBytes=" + stx);
          https.get(urlx2 + "&transactionBytes=" + stx, (resp) => {
              let data = '';
            
              resp.on('data', (chunk) => {
                data += chunk;
              });
            
              resp.on('end', () => {
                var resp = JSON.parse(data);
                if("errorDescription" in resp){
                    textwd.innerHTML="An error occured: " + resp["errorDescription"];
                }else{
                    adr.value="";
                    amt.value="";
                    terms.checked=false;
                    textwd.innerHTML="Your withdrawal is on its way: (Tx-ID " + resp["transaction"] + ")";

                }
               

                wd_btn.disabled = false;
                adr.disabled = false;
                amt.disabled = false;
                terms.disabled = false;
            });
  
        }).on("error", (err) => {
            textwd.innerHTML="An error occured: could not push the signed the transaction";
            //faucet_btn.style.opacity=1;
            wd_btn.disabled = false;
            adr.disabled = false;
            amt.disabled = false;
            terms.disabled = false;
        });
      }else{
        textwd.innerHTML="An error occured: the node replied something we did not understand";
            wd_btn.disabled = false;
            adr.disabled = false;
            amt.disabled = false;
            terms.disabled = false;
      }
      
    });
  
  }).on("error", (err) => {
      textwd.innerHTML="An error occured: the node could not be reached";
      //faucet_btn.style.opacity=1;
      wd_btn.disabled = false;
      adr.disabled = false;
      amt.disabled = false;
      terms.disabled = false;
  });
  })