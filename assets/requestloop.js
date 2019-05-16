'use strict'
const https = require('http');
const settings = require('./settingsholder.js')
const myEmitter = require('./pubsub.js');

const BigInteger = require("big-integer");
const nxt = require('nxtjs');
const querystring = require('querystring');

var loadbalancer = Math.floor(Math.random() * 5) + 1;
var ip = '';
const fip = "faucet.xel.org";

const testnet = settings.getIsTestnet();
const port = ((testnet) ? 16876 : 17876);

var connected = false;
var rpcurl = ''
var fauceturl = 'http://' + fip + ":" + ((testnet) ? "16876" : "17876") + "/nxt";

var firstFullDone = false;

const getContentPost = function(postData) {
    // return new pending promise
    return new Promise((resolve, reject) => {
        // select http or https module, depending on reqested url

        var post_options = {
            host: ip,
            port: port,
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
var createRingBuffer = function(length) {
    /* https://stackoverflow.com/a/4774081 */
    var pointer = 0,
        buffer = [];

    return {
        contains: function(element) {
            return buffer.indexOf(element) > -1;
        },
        get: function(key) {
            if (key < 0) {
                return buffer[pointer + key];
            } else if (key === false) {
                return buffer[pointer - 1];
            } else {
                return buffer[key];
            }
        },
        push: function(item) {
            buffer[pointer] = item;
            pointer = (pointer + 1) % length;
            return item;
        },
        prev: function() {
            var tmp_pointer = (pointer - 1) % length;
            if (buffer[tmp_pointer]) {
                pointer = tmp_pointer;
                return buffer[pointer];
            }
        },
        next: function() {
            if (buffer[pointer]) {
                pointer = (pointer + 1) % length;
                return buffer[pointer];
            }
        }
    };
};
var ringBuffer = createRingBuffer(200);


refresh();
var blocks = 0;
var balance = "0";
var balanceu = "0";
var totalOpen = 0;
var totalClosed = 0;
var balancenqt = "0";
var myOpen = 0;
var myClosed = 0;
var grabs = 0;
var lasttargets = [];
var works = [];
var zeros = "00000000";
var lastReceivedBlock = 0;
var lastReceivedBlockComputation = 0;
var signing = false;

// Longpoller

function refresh() {
	var loadbalancer = Math.floor(Math.random() * 6) + 1;
    const t = settings.getNode();
    const testnet = settings.getIsTestnet();

    if (testnet) {
        console.log("Setting t to testnet node because testnet=" + testnet);
        ip = "testnet-0" + loadbalancer + ".xel.org";
    } else if (t == "") {
        console.log("Setting t to node because t=" + t);
        ip = "computation-0" + loadbalancer + ".xel.org";
    } else if (t == "local") {
        console.log("Setting t to 127 because t=" + t);
        ip = "127.0.0.1";
    } else {
        console.log("Setting t to configured node because t=" + t);
        ip = t;
    }
    rpcurl = 'http://' + ip + ":" + ((testnet) ? "16876" : "17876") + "/nxt";
    let nt = document.getElementById('nodetext');
    //let ntt = document.getElementById('networktext');
    let st = document.getElementById('statusind');
    st.classList.remove("connected");
    st.classList.remove("disconnected");
    st.classList.add("disconnected");
    nt.innerHTML = "Node: <a href=# data-section=\"nodes\">" + ip + "</a> (" + ((testnet) ? "Test" : "Main") + ")</span>";
    //ntt.innerHTML = (testnet) ? "Testnet" : "Mainnet";
    document.getElementById('topwarning').style.display = "none";
    if (testnet)
        document.getElementById('topwarning').style.display = "block";
}

function amountconvert(amount) {
    if (amount == undefined) amount = "0";
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

function pullin() {
    if (lastReceivedBlock == 0 || lastReceivedBlockComputation == 0) {
        pullin_full();
    } else {
        // Invoke cheap checking
        pullin_light();
    }
}

function pullin_light() {
    const st = settings.getKey();
    https.get(rpcurl + "?requestType=getLastBlockId&account=" + st["id"], (resp) => {
        let data = '';

        resp.on('data', (chunk) => {
            data += chunk;
        });
        resp.on('end', () => {
            var resp = JSON.parse(data);
            connected = true;
            var alreadyfullpulled = false;
            var otherpull = false;
            if ("lastBlock" in resp) {
                if (lastReceivedBlock != resp["lastBlock"]) {
                    if (!alreadyfullpulled) {
                        alreadyfullpulled = true;
                        pullin_full();

                    }
                    otherpull = true;
                }
            } else {
                connected = false;
            }
            if ("lastBlockComputation" in resp) {
                if (lastReceivedBlockComputation != resp["lastBlockComputation"]) {
                    if (!alreadyfullpulled) {
                        alreadyfullpulled = true;
                        pullin_full();

                    }
                    otherpull = true;
                }
            } else {}
            if ("unconfirmedBalanceNQT" in resp) {
                balanceu = resp["unconfirmedBalanceNQT"];
            }
            if (!otherpull)
                pushinfo_light();
        });
    }).on("error", (err) => {
        connected = false;
        pushinfo_light();
    });
}

function sign_and_pay(unsigned_tx) {
    const st = settings.getKey();
    var unsigned = [];
    var prunables = [];
    var signed = [];

    if (signing == true) return new Promise(function(resolve, reject) {
        resolve();
    });
    if (firstFullDone == false) {
        firstFullDone = true;
        // TODO REMOVE return null;
    }
    return new Promise(function(resolve, reject) {
        if (signing == true) return;
        signing = true;

        for (var cx in unsigned_tx) {
            var t = unsigned_tx[cx];
            try {
                var x = t[0]["unsignedTransactionBytes"];
                console.log("Signing: " + x)
                var appd = t[1];
                if (ringBuffer.contains(x)) {} else {
                    var stx = nxt.signTransactionBytes(x, st["mnemonic"]);
                    signed.push(stx);
                    unsigned.push(x);
                    prunables.push(appd);
                }
            } catch (e) {}
        }

        for (var i = 0; i < signed.length; i++) {
            var datata = querystring.stringify({
                'transactionBytes': signed[i],
                'prunableAttachmentJSON': JSON.stringify(prunables[i])
            });
            getContentPost(datata)
                .then((html) => {
                    console.log(html);
                    if (html.indexOf("fullHash") > 0) {
                        ringBuffer.push(unsigned[i]);
                        console.log(html);
                        if (i == signed.length) {
                            console.log("Finished payouts");
                        } else {
                            console.log("Submitted " + i + " of " + signed.length);
                        }
                    } else {
                        console.log("Failed submitting a payment, we will try (and hope) in the next block: " + err);
                    }
                })
                .catch((err) => {
                    console.log("Failed submitting a payment on a large scale, we will try (and hope) in the next block: " + err);
                });
        }
        resolve();


    });
}

function pullin_full() {
    console.log("Doing a full pull using last known block id " + lastReceivedBlock + " and computation block " + lastReceivedBlockComputation);
    const st = settings.getKey();
    https.get(rpcurl + "?requestType=getState&includeLastTargets=true&includeTasks=true&account=" + st["id"], (resp) => {
        let data = '';

        resp.on('data', (chunk) => {
            data += chunk;
        });
        resp.on('end', () => {
            var resp = JSON.parse(data);
            connected = true;
            if ("numberOfBlocks" in resp) {
                blocks = resp["numberOfBlocks"];
            } else {
                connected = false;
            }
            if ("balanceNQT" in resp) {
                balance = resp["balanceNQT"];
                balancenqt = resp["balanceNQT"];
            } else {}

            if ("unconfirmedBalanceNQT" in resp) {
                balanceu = resp["unconfirmedBalanceNQT"];
            } else {}

            if ("lastTargets" in resp) {
                lasttargets = resp["lastTargets"];
            } else {}
            if ("myWorks" in resp) {
                works = resp["myWorks"];
            } else {}
            if ("lastBlock" in resp) {
                lastReceivedBlock = resp["lastBlock"];
            } else {}
            if ("lastBlockComputation" in resp) {
                lastReceivedBlockComputation = resp["lastBlockComputation"];
            } else {}
            if ("totalOpen" in resp) {
                totalOpen = resp["totalOpen"];
            } else {}
            if ("totalClosed" in resp) {
                totalClosed = resp["totalClosed"];
            } else {}
            if ("myOpen" in resp) {
                myOpen = resp["myOpen"];
            } else {}
            if ("myClosed" in resp) {
                myClosed = resp["myClosed"];
            } else {}
            if ("grabs" in resp) {
                grabs = resp["grabs"];
            } else {}

            if ("pendingPayouts" in resp && signing == false) {
                sign_and_pay(resp["pendingPayouts"]).then(function() {
                    signing = false;
                    console.log("Finished SIGN_AND_PAY");
                });
            }


            pushinfo();
        });
    }).on("error", (err) => {
        connected = false;
        pushinfo();
    });
}
var requestLoop = setInterval(function() {
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

function amountformat(amount) {
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
        offset++;
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

function pushinfo() {
    myEmitter.pubsub.emit('status', [connected, ip, testnet, blocks, balance, balanceu, lasttargets, totalOpen, totalClosed, myOpen, myClosed, grabs]);
    myEmitter.pubsub.emit('works', works);
}

function pushinfo_light() {
    myEmitter.pubsub.emit('status_light', [connected, balanceu]);
}

function getip() {
    return ip;
};

function getport() {
    return port;
};

function gettestnet() {
    return testnet;
};

function getrpcurl() {
    return rpcurl;
};

function getbb() {
    return balancenqt;
};
module.exports.getrpcurl = getrpcurl;
module.exports.getip = getip;
module.exports.getport = getport;
module.exports.gettestnet = gettestnet;
module.exports.init = pushinfo;
module.exports.amountformat = amountformat;
module.exports.fauceturl = fauceturl;
module.exports.refresh = refresh;
module.exports.formatNQT = formatNQT;
module.exports.formatNXT = formatNXT;
module.exports.getbb = getbb;
pullin();
