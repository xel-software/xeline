'use strict'
const myEmitter = require('./pubsub.js');
const reql = require("./requestloop.js");
const settings = require('./settingsholder.js')

const dgram = require('dgram');
const server = dgram.createSocket('udp4');
var lastBeacon = new Date(new Date().setFullYear(new Date().getFullYear() - 1))

var evals = 0;
var pow = 0;
var bty = 0;

server.on('error', (err) => {
    console.log(`server error:\n${err.stack}`);
    server.close();
});

function formatEvals(bytes, decimals) {
    if (bytes == 0) return '0 ';
    var k = 1000,
        dm = decimals || 2,
        sizes = [' ', ' k', 'M', 'G', 'T', 'P', 'E', 'Z', 'Y'],
        i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + sizes[i];
}
server.on('message', (msg, rinfo) => {
    try {
        var arr = msg.toString().split("/").map(val => Number(val));
        if (arr.length >= 3) {
            evals = arr[0];
            pow = arr[1];
            bty = arr[2];
            lastBeacon = new Date();
        }
    } catch (e) {}
});

server.on('listening', () => {
    const address = server.address();
    console.log(`server listening ${address.address}:${address.port}`);
});

function checkMiner() {
    var dif = (new Date()).getTime() - lastBeacon.getTime();
    let m1 = document.getElementById('minerstatus');
    let m2 = document.getElementById('minertext');
    let m3 = document.getElementById('minertext2');
    var Seconds_from_T1_to_T2 = dif / 1000;
    var Seconds_Between_Dates = Math.abs(Seconds_from_T1_to_T2);
    if (Seconds_Between_Dates > 3) {
        m1.classList.remove("connected");
        m1.classList.remove("disconnected");
        m1.classList.add("disconnected");
        m2.innerHTML = "Not Mining";
        m3.innerHTML = "0 eval / 0 pow / 0 bty";
    } else {
        m1.classList.remove("connected");
        m1.classList.remove("disconnected");
        m1.classList.add("connected");
        m2.innerHTML = "Mining";
        m3.innerHTML = formatEvals(evals, 0) + "eval / " + formatEvals(pow, 0) + "pow / " + formatEvals(bty, 0) + "bty";
    }
}
setInterval(function() {
    checkMiner();
}, 1000);

server.bind(41234, "127.0.0.1");

var ctx = document.getElementById("hashchart").getContext('2d');
var myChart = new Chart(ctx, {
    type: 'line',
    data: {
        labels: [],
        datasets: [{
            fill: 'origin',
            label: 'Computation Side-Chain Height',
            data: [],
            backgroundColor: [
                'rgba(255, 99, 132, 0.2)',
                'rgba(54, 162, 235, 0.2)',
                'rgba(255, 206, 86, 0.2)',
                'rgba(75, 192, 192, 0.2)',
                'rgba(153, 102, 255, 0.2)',
                'rgba(255, 159, 64, 0.2)'
            ],
            borderColor: [
                'rgba(255,99,132,1)',
                'rgba(54, 162, 235, 1)',
                'rgba(255, 206, 86, 1)',
                'rgba(75, 192, 192, 1)',
                'rgba(153, 102, 255, 1)',
                'rgba(255, 159, 64, 1)'
            ],
            borderWidth: 1
        }]
    },
    options: {
        scales: {
            yAxes: [{
                ticks: {
                    beginAtZero: true
                }
            }]
        }
    }
});

function addData(chart, label, data) {
    chart.data.labels = label;
    chart.data.datasets[0].data = data;
    chart.update();
}

function removeData(chart) {
    chart.data.labels = [];
    chart.data.datasets[0].data = [];
    chart.update();
}

myEmitter.pubsub.on('status_light', (event, arg) => {
    let st = document.getElementById('statusind');
    let balanceuc = document.getElementById('balanceuc');
    if (event[0] == false) {
        st.classList.remove("connected");
        st.classList.remove("disconnected");
        st.classList.add("disconnected");
    } else {
        st.classList.remove("connected");
        st.classList.remove("disconnected");
        st.classList.add("connected");
    }

    let balanceu = document.getElementById('balanceu');
    balanceu.innerHTML = reql.amountformat(event[1]);
    if (balance.innerHTML != balanceu.innerHTML) {
        balanceuc.style.visibility = "visible";
    } else {
        balanceuc.style.visibility = "hidden";
    }

});

myEmitter.pubsub.on('status', (event, arg) => {
	const t = settings.getNode();
    const testnet = settings.getIsTestnet();
    var loadbalancer = Math.floor(Math.random() * 6) + 1;
    var ip = "";
    if (testnet) {
        ip = "testnet-0" + loadbalancer + ".xel.org";
    } else if (t == "") {
        ip = "computation-0" + loadbalancer + ".xel.org";
    } else if (t == "local") {
        ip = "127.0.0.1";
    } else {
        ip = t;
    }

    let st = document.getElementById('statusind');
    let nt = document.getElementById('nodetext');
    //let ntt = document.getElementById('networktext');
    let bl = document.getElementById('blocks');
    let cp = document.getElementById('currentpower');
    let balance = document.getElementById('balance');
    let balanceu = document.getElementById('balanceu');
    let balanceuc = document.getElementById('balanceuc');

    let vto = document.getElementById('totalOpen');
    let vtc = document.getElementById('totalClosed');
    let vmo = document.getElementById('myOpen');
    let vmc = document.getElementById('myClosed');
    let vg = document.getElementById('grabs');

    nt.innerHTML = "Node: <a href=# data-section=\"nodes\">" + ip + "</a> (" + ((testnet) ? "Test" : "Main") + ")</span>";
    //ntt.innerHTML=(testnet)?"Testnet":"Mainnet";
    balance.innerHTML = reql.amountformat(event[4]);
    balanceu.innerHTML = reql.amountformat(event[5]);
    if (balance.innerHTML != balanceu.innerHTML) {
        balanceuc.style.visibility = "visible";
    } else {
        balanceuc.style.visibility = "hidden";
    }

    vto.innerHTML = event[7];
    vtc.innerHTML = event[8];
    vmo.innerHTML = event[9];
    vmc.innerHTML = event[10];
    vg.innerHTML = reql.amountformat(event[11]);


    var targets = event[6];
    var labels = [];
    var data = [];
    var currentmips = 0;
    for (var i = targets.length - 1; i >= 0; i--) {
        var dct = targets[i];
        var localmips = 0;
        labels.push(Object.keys(dct)[0]);
        var tgt = dct[Object.keys(dct)[0]];
        var scaler = 8789596572746 * 0.9; // empirically
        localmips = Math.round((scaler / tgt) * 57.5);
        //console.log("mips " + localmips);
        data.push(localmips);
        if (i == 0) currentmips = localmips;
    }
    cp.innerHTML = currentmips;

    removeData(myChart);
    addData(myChart, labels, data);
    myChart.update();

    if (balance.innerHTML != balanceu.innerHTML) {
        balanceuc.style.visibility = "visible";
    } else {
        balanceuc.style.visibility = "hidden";
    }
    if (event[0] == false) {
        st.classList.remove("connected");
        st.classList.remove("disconnected");
        st.classList.add("disconnected");
        bl.innerHTML = event[3];
    } else {
        st.classList.remove("connected");
        st.classList.remove("disconnected");
        st.classList.add("connected");
        bl.innerHTML = event[3];
    }

})
reql.init();
checkMiner();
