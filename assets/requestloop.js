'use strict'
const https = require('http');
const settings = require('./settingsholder.js')
const myEmitter = require('./pubsub.js');
const BigInteger = require("big-integer");

var loadbalancer = Math.floor(Math.random() * 5) + 1;
var ip = '';
const fip = "faucet.xel.org";

const testnet = true;
const port = ((testnet)?16876:17876);

var connected = false;
var rpcurl = ''
var fauceturl = 'http://' + fip + ":" + ((testnet)?"16876":"17876") + "/nxt";

refresh();
var blocks = 0;
var balance = "0";
var balanceu = "0";
var totalOpen = 0;
var totalClosed = 0;
var myOpen = 0;
var myClosed = 0;
var grabs = 0;
var lasttargets = [];
var works=[];
var zeros = "00000000";
var lastReceivedBlock = 0;

// Longpoller

function refresh(){
    const t = settings.getNode();
    if(t==""){
        ip = "balance-" + loadbalancer + ".xel.org";
    }else{
        ip = "127.0.0.1";
    }
    rpcurl = 'http://' + ip + ":" + ((testnet)?"16876":"17876") + "/nxt";
    let nt = document.getElementById('nodetext');
    let st = document.getElementById('statusind');
    st.classList.remove("connected");
    st.classList.remove("disconnected");
    st.classList.add("disconnected");
    nt.innerHTML="Node: <a href=# data-section=\"nodes\">" + ip + "</a> (" + ((testnet)?"Test":"Main") +")</span>";

    document.getElementById('topwarning').style.display="none";
    if(testnet)
        document.getElementById('topwarning').style.display="block";
}

function amountconvert (amount) {
    if(amount == undefined) amount = "0";
    var negative = "";
    var mantissa = "";

    if (typeof amount != "object") {
        amount = BigInteger(String(amount));
    }

    if (amount.compareTo(BigInteger.zero) < 0) {
        amount = amount.abs();
        negative = "-";
    }

    var fractionalPart = amount.mod(BigInteger("100000000")).toString();
    amount = amount.divide(BigInteger("100000000"));

    if (fractionalPart && fractionalPart != "0") {
        mantissa = ".";

        for (var i = fractionalPart.length; i < 8; i++) {
            mantissa += "0";
        }

        mantissa += fractionalPart.replace(/0+$/, "");
    }

    amount = amount.toString();

    return {
        "negative": negative,
        "amount": amount,
        "mantissa": mantissa
    };
};

function pullin(){
    if(lastReceivedBlock==0){
        pullin_full();
    }else{
        // Invoke cheap checking
        pullin_light();
    }
}

function pullin_light(){
    const st = settings.getKey();
    https.get(rpcurl + "?requestType=getLastBlockId&account=" + st["id"], (resp) => {
          let data = '';
    
          resp.on('data', (chunk) => {
            data += chunk;
          });
          resp.on('end', () => {
            var resp = JSON.parse(data);
                connected = true;
                if ("lastBlock" in resp){
                    if(lastReceivedBlock!=resp["lastBlock"])
                        pullin_full();
                }else
                {
                    connected = false;
                }

                if ("unconfirmedBalanceNQT" in resp){
                    balanceu = resp["unconfirmedBalanceNQT"];
                }
                pushinfo_light();
          });
        }).on("error", (err) => {
            connected=false;
            pushinfo_light();
        });
}

function pullin_full(){
    console.log("Doing a full pull using last known block id " + lastReceivedBlock);
    const st = settings.getKey();
    https.get(rpcurl + "?requestType=getState&includeLastTargets=true&includeTasks=true&account=" + st["id"], (resp) => {
      let data = '';

      resp.on('data', (chunk) => {
        data += chunk;
      });
      resp.on('end', () => {
        var resp = JSON.parse(data);
            connected = true;
            if ("numberOfBlocks" in resp){
                blocks = resp["numberOfBlocks"];
            }else
            {
                connected = false;
            }
            if ("balanceNQT" in resp){
                balance = resp["balanceNQT"];
            }else
            {
            }
            if ("lastBlock" in resp){
                lastReceivedBlock = resp["lastBlock"];
            }else
            {
            }
            if ("unconfirmedBalanceNQT" in resp){
                balanceu = resp["unconfirmedBalanceNQT"];
            }else
            {
            }

            if ("lastTargets" in resp){
                lasttargets = resp["lastTargets"];
            }else
            {
            }
            if ("myWorks" in resp){
                works = resp["myWorks"];
            }else
            {
            }
            if ("totalOpen" in resp){
                totalOpen = resp["totalOpen"];
            }else
            {
            }
            if ("totalClosed" in resp){
                totalClosed = resp["totalClosed"];
            }else
            {
            }
            if ("myOpen" in resp){
                myOpen = resp["myOpen"];
            }else
            {
            }
            if ("myClosed" in resp){
                myClosed = resp["myClosed"];
            }else
            {
            }
            if ("grabs" in resp){
                grabs = resp["grabs"];
            }else
            {
            }

            pushinfo();
      });
    }).on("error", (err) => {
        connected=false;
        pushinfo();
    });
}
var requestLoop = setInterval(function(){
    pullin();
}, 5000);

function format(params, zeroPad) {
    var amount;
    var mantissa;
    if (typeof params != "object") {
        amount = String(params);
        if (amount.indexOf(".") !== -1) {
            mantissa = amount.substr(amount.indexOf("."));
            amount = amount.replace(mantissa, "");
        } else {
            mantissa = "";
        }
        var negative = amount.charAt(0) == "-" ? "-" : "";
        if (negative) {
            amount = amount.substring(1);
        }
        params = {
            "amount": amount,
            "negative": negative,
            "mantissa": mantissa
        };
    }

    amount = String(params.amount);
    var digits = amount.split("").reverse();
    var formattedAmount = "";
    var formattedMantissa = params.mantissa;
    if (zeroPad) {
        var mantissaLen = formattedMantissa.length;
        if (mantissaLen > 0) {
            formattedMantissa += zeros.substr(0, zeroPad - mantissaLen + 1);
        } else {
            formattedMantissa += zeros.substr(0, zeroPad);
            if (zeroPad != 0) {
                formattedMantissa = '.' + formattedMantissa;
            }
        }
    }
    for (var i = 0; i < digits.length; i++) {
        if (i > 0 && i % 3 == 0) {
            formattedAmount = "," + formattedAmount;
        }
        formattedAmount = digits[i] + formattedAmount;
    }

    var output = (params.negative ? params.negative : "") + formattedAmount + formattedMantissa;
    return output;
};

function amountformat (amount) {
    if (typeof amount == "undefined") {
        amount = "0";
    } else if (typeof amount == "string") {
        amount = BigInteger(amount);
    }

    var negative = "";
    var mantissa = "";

    var params = amountconvert(amount);

    negative = params.negative;
    amount = params.amount;
    mantissa = params.mantissa;

    var offset = 0;
            if (mantissa != "" && mantissa.substring(0, 1) == ".") {
                offset ++;
            }
            var maxLength = 6 + offset;
            if (mantissa.length > maxLength) {
                mantissa = mantissa.substring(0, maxLength);
                if (mantissa.length == 1 && mantissa.substring(0, 1) == ".") {
                    mantissa = "";
                }
            }

    return format({
        "negative": negative,
        "amount": amount,
        "mantissa": mantissa
    }, 6);
};

function formatNXT(currency) {
    return currency.toFixed(8);
}

function formatNQT(currency) {
    currency = String(currency);

    var parts = currency.split(".");

    var amount = parts[0];

    //no fractional part
    var fraction;
    if (parts.length == 1) {
        fraction = "00000000";
    } else if (parts.length == 2) {
        if (parts[1].length <= 8) {
            fraction = parts[1];
        } else {
            fraction = parts[1].substring(0, 8);
        }
    } else {
        throw $.t("error_invalid_input");
    }

    for (var i = fraction.length; i < 8; i++) {
        fraction += "0";
    }

    var result = amount + "" + fraction;

    //in case there's a comma or something else in there.. at this point there should only be numbers
    if (!/^\d+$/.test(result)) {
        throw $.t("error_invalid_input");
    }

    //remove leading zeroes
    result = result.replace(/^0+/, "");

    if (result === "") {
        result = "0";
    }

    return result;
};

function pushinfo(){
    myEmitter.pubsub.emit('status', [connected, ip, testnet,blocks, balance, balanceu, lasttargets, totalOpen, totalClosed, myOpen, myClosed, grabs]);
    myEmitter.pubsub.emit('works', works);
}

function pushinfo_light(){
    myEmitter.pubsub.emit('status_light', [connected, balanceu]);
}

module.exports.rpcurl = rpcurl;
module.exports.ip = ip;
module.exports.port = port;
module.exports.testnet = testnet;
module.exports.init = pushinfo;
module.exports.amountformat = amountformat;
module.exports.formatNQT = formatNQT;
module.exports.formatNXT = formatNXT;
module.exports.fauceturl=fauceturl;
module.exports.refresh=refresh;

pullin();