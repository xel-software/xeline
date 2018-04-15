const cp = require('crypto')
function swap32(src) {
    return (
        ((src & 0xFF000000) >> 24) |
        ((src & 0x00FF0000) >> 8) |
        ((src & 0x0000FF00) << 8) |
        ((src & 0x000000FF) << 24)
    );
}
function toHexString(byteArray) {
    return Array.prototype.map.call(byteArray, function(byte) {
      return ('0' + (byte & 0xFF).toString(16)).slice(-2);
    }).join('');
  }
var u = [0x01000000,
0x00000000,
0x00000000,
0x00000000,
0x00000000,
0x00000000,
0x00000000,
0x00000000,
0x00000000,
0x3BA3EDFD,
0x7A7B12B2,
0x7AC72C3E,
0x67768F61,
0x7FC81BC3,
0x888A5132,
0x3A9FB8AA,
0x4B1E5E4A,
0x29AB5F49,
bounties[0][1],  
bounties[0][0]];


var hash = cp.createHash('sha256');
var hash2 = cp.createHash('sha256');

var bytes = new Int32Array(Object.keys(u).map(function(k) { return swap32(u[k])}));
var uin = new Uint8Array(bytes.buffer);
console.log(uin);
//var result = hash2.update(hash.update(uin).digest()).digest("hex");
var result = hash2.update(uin).digest("hex");
console.log("Miner found header: " + toHexString(uin));
console.log("This results in hash: " + result);