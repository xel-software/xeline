'use strict'
const myEmitter = require('./pubsub.js');
const app = require('electron').remote.app
const querystring = require('querystring');
const nav = require('./nav.js');
const settings = require('./settingsholder.js')
const https = require('http');
const requestloop = require('./requestloop.js')
const nxt = require('nxtjs');
const workreader = require('./workreader.js');
const vm = require('vm');
const util = require('util');
const timeAgo = require('node-time-ago');
const currentMetadata = null;
const path = require('path')
const fs = require('fs');
var async = require('async');
var toBeSigned = [];
var toBeHead = {};
var totalfees = 0;
var init = 0;
var metadata = {};
var broadcast=[];

myEmitter.pubsub.on('works', (event, arg) => {
    var myNode = document.getElementById("taskbody");

    if (myNode == null) return;
    var tableRows = myNode.getElementsByTagName('tr');
    var rowCount = tableRows.length;

    for (var x = rowCount - 1; x >= 0; x--) {
        myNode.removeChild(tableRows[x]);
    }

    for (var i = 0; i < event.length; ++i) {
        myNode.innerHTML += GetRow(event[i]);
    }
});


myEmitter.pubsub.on('show-newtask-section', (event, arg) => {

    document.getElementById('DropList').onchange = function() {
        var t = document.getElementById('DropList');
        if (t.options[t.selectedIndex].value != "") workOpen(t.options[t.selectedIndex].value);
        t.selectedIndex = 0;
    };

    document.getElementById('file').onchange = function(event) {
        workOpen(event.target.files[0].path);
    };

    (function() {



        var holder = document.getElementById("dragarea");

        holder.ondragover = (e) => {
            e.preventDefault();
            return false;
        };

        holder.ondragleave = () => {
            return false;
        };

        holder.ondragend = () => {
            return false;
        };

        holder.ondrop = (e) => {
            e.preventDefault();

            for (let f of e.dataTransfer.files) {
                workOpen(f.path);
            }

            return false;
        };
    })();

    var select = document.getElementById("DropList");
    var length = select.options.length;
    for (var i = 1; i < length; i++) {
        select.options[i] = null;
    }
    for (var i = 0; i < workreader.demos.length; i++) {
        var opt = document.createElement('option');
        opt.value = workreader.demos[i]["file"];
        opt.innerHTML = workreader.demos[i]["title"];
        select.appendChild(opt);
    }
});

function killwork(idd){
    const st = settings.getKey();
    console.log("Killing work: " + idd);
    var myNode = document.getElementById("closework_" + idd);
    myNode.innerHTML="Waiting";
          myNode.disabled = true;
     
          var post_data = querystring.stringify({
            'publicKey': settings.toHexString(st["pub"]),
            
            'work_id': idd,
        });
          var post_options = {
              host: requestloop.ip,
              port: requestloop.port,
              path: '/nxt?requestType=cancelWork',
              method: 'POST',
              headers: {
                  'Content-Type': 'application/x-www-form-urlencoded',
                  'Content-Length': Buffer.byteLength(post_data)
              }
          };
  
  
  
          // Here, try to obtain unsigned TX from the node
          var poster = https.request(post_options, (resp) => {
              let data = '';
  
  
              resp.on('data', (chunk) => {
                  data += chunk;
              });
  
  
              resp.on('end', () => {
  
                  var resp = JSON.parse(data);
                  if ("errorDescription" in resp) {
                      console.log(resp);
                    myNode.innerHTML="Cancel";
                    myNode.disabled = false;
                  } else if ("transactions" in resp) {
                      toBeSigned = resp["transactions"];
                      console.log(toBeSigned);
                    
                      myNode.innerHTML="Signing";

                      var signed = [];
                      var signedA = [];
                      for (var x in toBeSigned) {
                          console.log(toBeSigned[x]);
                          var bts = toBeSigned[x]["unsignedTransactionBytes"];
                          var stx = nxt.signTransactionBytes(bts, st["mnemonic"]);
                          signed.push(stx);
                          signedA.push(toBeSigned[x]["transactionJSON"]["attachment"]);
                      }
                      var datata = querystring.stringify({
                        'transactionBytes': signed[0],
                        'prunableAttachmentJSON': JSON.stringify(signedA[0])
                    });
                          getContentPost(datata)
                              .then((html) => {
                                      var t = JSON.parse(html);
                                      if ("errorDescription" in t) {
                                        myNode.innerHTML="Cancel";
                                        myNode.disabled = false;
                                      } else {
                                        myNode.innerHTML="Cancelling";  
                                        broadcast.push(idd);            
                                      }
                              })
                              .catch((err) => {
                                  console.log(err);
                                  myNode.innerHTML="Cancel";
                                        myNode.disabled = false;
                              });
                  } else { console.log("unknown error: " + resp);
                    myNode.innerHTML="Cancel";
                    myNode.disabled = false;
                  }
              }).on("error", (err) => {
                console.log(err);
                myNode.innerHTML="Cancel";
                myNode.disabled = false;
              });
  
          });
          poster.write(post_data);
          poster.end();

}
function GetRow(work) {
    var op = settings.getWork(work["id"])
    var cb = false;
    var cbs = "";
    var result='';
    if (op != null && op["callback"] != "") {
        cb = true;
        cbs = op["callback"];
    }
    var notnormal = work["cancelled"] | work["timedout"];
    var closed = work["closed"];

    if(closed && cb && (op["output"]=="@@@@@@" || op["output"]=="An error occurred when evaluating the callback script. We will try again later, fix the script please!")){
        if(cbs=="") cbs="default.js";
        var ppp = path.join(app.getPath('userData'),"..", 'callbacks', cbs);
        if (!fs.existsSync(ppp)){
            ppp=path.join(__dirname,"..","callbacks", cbs);
        }


        var outp = "An error occurred when evaluating the callback script. We will try again later, fix the script please!";
        try
        {
            console.log("About to run: " + ppp);
            var f = workreader.readAll(ppp);
            if(work["storages"]==null) work["storages"]=[];
            if(work["bounties"]==null) work["bounties"]=[];
            f="var storages = " + JSON.stringify(work["storages"]) + ";\n" + f;
            f="var bounties = " + JSON.stringify(work["bounties"]) + ";\n" + f;
            const cons ={
                log: (...args) => result+= (util.format(...args) + '\n'),
            };
            eval(`((console) => { ${f} })`)(cons);
            op["output"]=result;
            settings.storeWork(work["id"],op);
        
        }catch(e){
            console.log("Failed running callback:");
            console.log(e);
            // Fallback to default script
            op["output"]="An error occurred when evaluating the callback script: " + e;
            settings.storeWork(work["id"],op);
            
        }
    }else if(closed && cb){
    }
    
    var element = '<tr class="smaller">';
    if (cb)
        element += '<td style="padding-left: 5px; width: 24px"><i class=\'fa fa-check-circle\'></i></td>';
    else
        element += '<td style="padding-left: 5px; width: 24px"><i class=\'fa fa-ban\'></i></td>';

    if (op != null) {
        element += '<td>' + op["title"] + '</td>';
    } else {
        element += '<td>' + work["id"] + '</td>';
    }
    var bties = (work['bounty_limit_per_iteration'] * (work['iterations'] - work['iterations_left']) + work['received_bounties'])*1.0;
    var total = (work['bounty_limit_per_iteration']);
    var iters = Math.floor(bties / total);
    console.log(bties + " / " + total + " = " + iters);
    element += '<td><b>' + work['received_pows'] + '/' + work['cap_number_pow'] + '</b></td>';
    element += '<td><b>' + iters + ' of ' + work['iterations'] + '</b></td>';
    element += '<td><b>' + (work['bounty_limit_per_iteration'] * (work['iterations'] - work['iterations_left']) + work['received_bounties']) + '/' + (work['bounty_limit_per_iteration'] * work['iterations']) + '</b></td>';

    if (!closed)
        element += '<td>' + (work['max_closing_height'] - work['work_at_height']) + ' Blks</td>';
    else {
        if (work["timedout"] == true) {
            element += '<td colspan=2>timed out ' + timeAgo(work['closing_timestamp']) + '</td>';
        } else if (work["cancelled"] == true) {
            element += '<td colspan=2>cancelled ' + timeAgo(work['closing_timestamp']) + '</td>';
        } else element += '<td conspan=2>finished ' + timeAgo(work['closing_timestamp']*1000+1385294400000) + '</td>';
    }

    if (!closed){
        if(broadcast.indexOf(work["id"])>-1){
            element += '<td><button id=\'closework_' + work["id"] + '\' onclick="taskscripts.killwork(\'' + work["id"] + '\');" disabled>Broadcast</button></td>';

        }else{
            element += '<td><button id=\'closework_' + work["id"] + '\' onclick="taskscripts.killwork(\'' + work["id"] + '\');">Cancel</button></td>';

        }
    }
    //else
    //    element += '<td></td>';
    element += '</tr>';

    if (cb) {
        if (!closed) {
            element += '<tr>';
            element += '  <td></td><td colspan="6" class="smaller statspan">Once the job is finished, you will see here the result of the callback function located in \'' + op["callback"] + '\'.</td>';
            element += '</tr>';
        } else {
            if (notnormal) {
                element += '<tr>';
                element += '  <td></td><td colspan="6" class="smaller statspan">The callback was not called because the job terminated abnormally (timeout or cancellation).</td>';
                element += '</tr>';
            } else {
                element += '<tr>';
                element += '  <td></td><td colspan="6" class="smaller statspan shell-body">' + op["output"] +'</td>';
                element += '</tr>';
            }
        }
    } else {
        element += '<tr>';
        element += '  <td></td><td colspan="6" class="smaller statspan">This job does not have a callback assigned. Callbacks can help you automatically analyze your results. Please read more on this topic in the ePL handbook.</td>';
        element += '</tr>';
    }
    return element;
}

function Clear() {
    // do something
    var txtwt3 = document.getElementById('txtwt3');
    txtwt3.innerHTML = "";
}

// return {"file": the_path,"title":title,"callback":callback,"timeout":timeout,"iterations":iterations,"pow_limit":pow_limit,"pow_price":pow_price,"bounty_limit":bounty_limit,"bounty_price":bounty_price};

const getContent = function(url) {
    // return new pending promise
    return new Promise((resolve, reject) => {
        // select http or https module, depending on reqested url


        const request = https.get(url, (response) => {

            // handle http errors
            if (response.statusCode < 200 || response.statusCode > 299) {
                reject(new Error('Failed to load page, status code: ' + response.statusCode));
            }
            // temporary data holder
            const body = [];
            // on every content chunk, push it to the data array
            response.on('data', (chunk) => {
                body.push(chunk)
            });
            // we are done, resolve promise with those joined chunks
            response.on('end', () => resolve(body.join('')));
        });
        // handle connection errors of the request
        request.on('error', (err) => reject(err))
    })
};

const getContentPost = function(postData) {
    // return new pending promise
    return new Promise((resolve, reject) => {
        // select http or https module, depending on reqested url

        var post_options = {
            host: requestloop.ip,
            port: requestloop.port,
            path: '/nxt?requestType=sendTransaction',
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Content-Length': Buffer.byteLength(postData)
            }
        };
        const request = https.request(post_options, (response) => {

            // handle http errors
            if (response.statusCode < 200 || response.statusCode > 299) {
                reject(new Error('Failed to load page, status code: ' + response.statusCode));
            }
            // temporary data holder
            const body = [];
            // on every content chunk, push it to the data array
            response.on('data', (chunk) => {
                body.push(chunk)
            });
            // we are done, resolve promise with those joined chunks
            response.on('end', () => resolve(body.join('')));
        });
        // handle connection errors of the request
        request.on('error', (err) => reject(err));

        request.write(postData);
        request.end();
    })
};

function workOpen(f) {
    const st = settings.getKey();
    var txtwt3 = document.getElementById('txtwt3');
    metadata = workreader.readMetadata(f);
    metadata["finished"] = "";

    if (metadata == null) {
        txtwt3.innerHTML = "The work you have tried to open does not have any (or incomplete) metadata";
        setTimeout(Clear, 3000);
    } else {
        var post_data = querystring.stringify({
            'publicKey': settings.toHexString(st["pub"]),
            'source_code': workreader.readAll(metadata['file']),
            'work_deadline': metadata['timeout'],
            'xel_per_pow': Math.floor(metadata['pow_price'] * 100000000),
            'xel_per_bounty': Math.floor(metadata['bounty_price'] * 100000000),
            'bounty_limit_per_iteration': metadata['bounty_limit'],
            'iterations': metadata['iterations'],
            'cap_pow': metadata['pow_limit'],
        });


        txtwt3.innerHTML = "<span class='double-bounce1' id='bouncer1'></span><span class='double-bounce2' id='bouncer2'></span> <span id='faucet'>Hang tight, we are verifying the syntactical correctness ...</span>";
        var urlx = requestloop.rpcurl + '?requestType=createWork';
        var urlx2 = requestloop.rpcurl + '?requestType=sendTransaction';

        var post_options = {
            host: requestloop.ip,
            port: requestloop.port,
            path: '/nxt?requestType=createWork',
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Content-Length': Buffer.byteLength(post_data)
            }
        };



        // Here, try to obtain unsigned TX from the node
        var poster = https.request(post_options, (resp) => {
            let data = '';


            resp.on('data', (chunk) => {
                data += chunk;
            });


            resp.on('end', () => {
                txtwt3.innerHTML = "";

                var resp = JSON.parse(data);
                if ("errorDescription" in resp) {
                    txtwt3.innerHTML = "An error occured: " + resp["errorDescription"];
                    setTimeout(Clear, 3000);
                } else if ("transactions" in resp) {
                    toBeSigned = resp["transactions"];
                    toBeHead = metadata;
                    totalfees = 0;
                    console.log(toBeSigned);
                    for (var x in toBeSigned) {
                        totalfees += parseInt(toBeSigned[x]["transactionJSON"]["feeNQT"]) / 100000000;
                    }
                    /*var ub = resp["unsignedTransactionBytes"];
                    var stx = nxt.signTransactionBytes(ub, st["mnemonic"]);
                    console.log("Calling: " + urlx2 + "&transactionBytes=" + stx);
                    https.get(urlx2 + "&transactionBytes=" + stx, (resp) => { 
                        let data = '';

                         
                        resp.on('data', (chunk) => {  
                            data += chunk; 
                        });

                         
                        resp.on('end', () => {
                            var resp = JSON.parse(data);
                            if ("errorDescription" in resp) {
                                text.innerHTML = "An error occured: " + resp["errorDescription"];
                            } else {
                                adr.value = "";
                                amt.value = "";
                                terms.checked = false;
                                text.innerHTML = "Your withdrawal is on its way: (Tx-ID " + resp["transaction"] + ")";

                            }


                            wd_btn.disabled = false;
                            adr.disabled = false;
                            amt.disabled = false;
                            terms.disabled = false;
                        });*/
                    nav.manualSection("newtask2");
                } else {
                    txtwt3.innerHTML = "An error occured: the node just returned garbage, please double check your task";
                    setTimeout(Clear, 3000);
                }
            }).on("error", (err) => {
                txtwt3.innerHTML = "An error occured while sending the request to the node";
                setTimeout(Clear, 3000);
            });

        });
        poster.write(post_data);
        poster.end();


    }
}


/*
<tr><td>Iterations:</td><td><span id="x1"></span></td></tr>
    <tr><td>Bounties per iteration:</td><td><span id="x2"></span></td></tr>
    <tr><td>Proof-of-work limit:</td><td><span id="x3"></span></td></tr>
    <tr><td>Payment per proof-of-work:</td><td><span id="x4"></span></td></tr>
    <tr><td>Payment per bounty:</td><td><span id="x5"></span></td></tr>
    <tr><td>Maximum total cost for job:</td><td><span id="x6"></span></td></tr>
    <tr><td>Fees for broadcast:</td><td><span id="x7"></span></td></tr>
    <tr><td>Callback script:</td><td><span id="x8"></span></td></tr>

    // return {"file": the_path,"title":title,"callback":callback,"timeout":timeout,"iterations":iterations,"pow_limit":pow_limit,"pow_price":pow_price,"bounty_limit":bounty_limit,"bounty_price":bounty_price};


    */

function initme() {


    let wd_btn10 = document.getElementById('wd_btn10');
    let txt10 = document.getElementById('txt10');

    wd_btn10.addEventListener('click', () => {
        const st = settings.getKey();

        txt10.innerHTML = "<span class='double-bounce1' id='bouncer1'></span><span class='double-bounce2' id='bouncer2'></span> <span id='faucet'>Hang tight, we are signing and broadcasting your transactions</span>";

        var signed = [];
        var signedA = [];
        for (var x in toBeSigned) {
            console.log(toBeSigned[x]);
            var bts = toBeSigned[x]["unsignedTransactionBytes"];
            var stx = nxt.signTransactionBytes(bts, st["mnemonic"]);
            signed.push(stx);
            signedA.push(toBeSigned[x]["transactionJSON"]["attachment"]);
        }
        txt10.innerHTML = "<span class='double-bounce1' id='bouncer1'></span><span class='double-bounce2' id='bouncer2'></span> <span id='faucet'>Signing finished, broadcasting " + signed.length + " TX now ...</span>";
        var urlx2 = requestloop.rpcurl + '?requestType=sendTransaction';
        for (var i = 0; i < signed.length; i++) {
            var datata = querystring.stringify({
                'transactionBytes': signed[i],
                'prunableAttachmentJSON': JSON.stringify(signedA[i])
            });
            console.log("Broadcasting:");
            console.log({
                'transactionBytes': signed[i],
                'prunableAttachmentJSON': signedA[i]
            });
            getContentPost(datata)
                .then((html) => {
                    if (i == signed.length) {
                        var t = JSON.parse(html);
                        if ("errorDescription" in t) {
                            txt10.innerHTML = "Fatal error: " + t["errorDescription"];
                        } else {
                            metadata["txid"] = t["transaction"];
                            metadata["output"] = "@@@@@@";
                            settings.storeWork(metadata["txid"], metadata);
                            txt10.innerHTML = "Successfully broadcasted job with transaction ID = " + t["transaction"] + "<br>Please go into your <a id=tmp data-section='mytasks'>work list overview</a>, it should appear there shortly!";

                        }

                    } else {
                        console.log("Submitted " + i + " of " + signed.length);
                    }
                })
                .catch((err) => {
                    txt10.innerHTML = "An error occured during the broadcast: " + err
                });
        }




    });
}
myEmitter.pubsub.on('show-newtask2-section', (event, arg) => {

    if (init == 0) {
        init = 1;
        initme();
    };
    txt10.innerHTML = "";
    var x0 = document.getElementById("x0");
    var x1 = document.getElementById("x1");
    var x2 = document.getElementById("x2");
    var x3 = document.getElementById("x3");
    var x4 = document.getElementById("x4");
    var x5 = document.getElementById("x5");
    var x6 = document.getElementById("x6");
    var x7 = document.getElementById("x7");
    var x8 = document.getElementById("x8");

    x0.innerHTML = toBeHead["title"];
    x1.innerHTML = toBeHead["iterations"];
    x2.innerHTML = toBeHead["bounty_limit"];
    x3.innerHTML = toBeHead["pow_limit"];
    x4.innerHTML = requestloop.formatNXT(toBeHead["pow_price"]);
    x5.innerHTML = requestloop.formatNXT(toBeHead["bounty_price"]);
    x6.innerHTML = requestloop.formatNXT(toBeHead["pow_limit"] * toBeHead["pow_price"] + (toBeHead["iterations"] * toBeHead["bounty_limit"] * toBeHead["bounty_price"]));
    x7.innerHTML = requestloop.formatNXT(totalfees);
    x8.innerHTML = toBeHead["callback"];
});

module.exports.killwork = killwork;