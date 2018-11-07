var Mnemonic = require('bitcore-mnemonic');
const Store = require('./store.js');

const sha256 = require('sha256');
const Long = require('long');
const NRS = require('nxtjs');
const Curve = require('./curve25519.js');
function intFromBytes( x, rnd){
  var val = 0;
  for (var i = 0; i < 4; ++i) {   
    var kgp = 0;
    if(rnd==1)
      kgp=7-i;
    else
      kgp=3-i;     
      val += x[kgp];        
      if (i < 3) {
          val = val << 8;
      }
  }
  return val;
}
// First instantiate the class
const store = new Store({
  // We'll call our data file 'user-preferences'
  configName: 'xeline-preferences-x',
  defaults: {
    // 800x600 is the default size of our window
    windowBounds: { width: 800, height: 600 },
    isTestnet: false
  }
});

function toHexString(byteArray) {
  return Array.from(byteArray, function(byte) {
    return ('0' + (byte & 0xFF).toString(16)).slice(-2);
  }).join('')
}

// Do not rely on nrsjs on this one, we want to do crypto ourselves
function checkKey(){
  var key = store.get('privateKeyStoreAXWXD5');
  return key;
}

function getNode(){
  var key = store.get('node');
  if(key==null)
    key="";
  return key;
}

function setNode(x){
  return new Promise(function(resolve){
    store.set('node', x);
    resolve();
  });
}

function getKey(){
    var key = store.get('privateKeyStoreAXWXD5');
    if(key==null){
        var code = new Mnemonic(Mnemonic.Words.ENGLISH);
        var mnemonic = code.toString();
        var priv = sha256(mnemonic, { asBytes: true });
        var pub = Curve.keygen(priv);
        var pubsha = sha256(pub, { asBytes: true });
        var accid = new Long(intFromBytes(pubsha, 2), intFromBytes(pubsha,1), true).toString();
        var reed = NRS.rsConvert(accid)["accountRS"].replace("NXT","XEL"); // this is the only exception
        key = {"mnemonic" : mnemonic, "priv": priv, "pub" : pub, "address": reed, "id": accid, "pubsha": pubsha, "reed" : reed};
        store.set('privateKeyStoreAXWXD5', key);
    }
    return key;
}

function getWork(ida){
    var key = store.get(ida);
    if(key==null){
        return null;
    }
    return key;
}

function storeWork(ida, metadata){
    store.set(ida, metadata);
}
function checkAbout(){
  var key = store.get('aboutShown');
  return key;
}
function setAbout(){
  store.set("aboutShown","yes");
}

function setIsTestnet(x){
  return new Promise(function(resolve){
    store.set('isTestnet', x.toString());
    resolve();
  });
}
function getIsTestnet(){
  var key = store.get('isTestnet');
  if(key==null)
    key='false';
  return (key == 'true');
}


module.exports.getKey = getKey;
module.exports.toHexString = toHexString;
module.exports.getWork = getWork;
module.exports.storeWork = storeWork;
module.exports.checkKey = checkKey;
module.exports.checkAbout = checkAbout;
module.exports.setAbout = setAbout;
module.exports.setNode = setNode;
module.exports.getNode = getNode;
module.exports.setIsTestnet = setIsTestnet;
module.exports.getIsTestnet = getIsTestnet;