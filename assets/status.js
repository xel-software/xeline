'use strict'
const myEmitter = require('./pubsub.js');
const reql = require("./requestloop.js");


  var ctx = document.getElementById("hashchart").getContext('2d');
  var myChart = new Chart(ctx, {
      type: 'line',
      data: {
          labels: [],
          datasets: [
              {fill: 'origin', 
              label: 'Block Height',
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
                      beginAtZero:true
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
    if(event[0]==false){
        st.classList.remove("connected");
        st.classList.remove("disconnected");
        st.classList.add("disconnected");
    }else{
        st.classList.remove("connected");
        st.classList.remove("disconnected");
        st.classList.add("connected");
    }
});

myEmitter.pubsub.on('status', (event, arg) => {
    let st = document.getElementById('statusind');
    let nt = document.getElementById('nodetext');
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

    nt.innerHTML="Node: <a href=#>" + reql.ip + "</a> (" + ((reql.testnet)?"Test":"Main") +")</span>";
    balance.innerHTML=reql.amountformat(event[4]);
    balanceu.innerHTML=reql.amountformat(event[5]);


    vto.innerHTML = event[7];
    vtc.innerHTML  = event[8];
    vmo.innerHTML  = event[9];
    vmc.innerHTML  = event[10];
    vg.innerHTML  = reql.amountformat(event[11]);


    var targets = event[6];
    var labels = [];
    var data = [];
    var currentmips = 0;
    for (var i=targets.length-1; i>=0; i--) {
      var dct = targets[i];
      var localmips = 0;
      labels.push(Object.keys(dct)[0]);
      var tgt=dct[Object.keys(dct)[0]];
      var scaler = 8789596572746*0.9; // empirically
      localmips = Math.round((scaler/tgt)*57.5);
      //console.log("mips " + localmips);
      data.push(localmips); 
      if(i==0) currentmips=localmips;
    }
    cp.innerHTML = currentmips;

    removeData(myChart);
    addData(myChart, labels, data);
    myChart.update();

    if(balance.innerHTML!=balanceu.innerHTML){
        balanceuc.style.visibility="visible";
    }else{
        balanceuc.style.visibility="hidden";
    }
    if(event[0]==false){
        st.classList.remove("connected");
        st.classList.remove("disconnected");
        st.classList.add("disconnected");
        bl.innerHTML = event[3];
    }else{
        st.classList.remove("connected");
        st.classList.remove("disconnected");
        st.classList.add("connected");
        bl.innerHTML = event[3];
    }
    
  })
  reql.init();

