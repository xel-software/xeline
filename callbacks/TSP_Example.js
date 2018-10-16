// input m array is stored in array "bounties"
// storage integers of last iteration are stored in array "storages"
var path = "Path: ";
var i;
for (i = 1; i < 49; i++) {
    path += storages[0]["storage"][i] + "\t";
}
//path = path + storages[1];
if(storages[0]["storage"][0] > 0)
{
  console.log("A miner has found a PATH less than 40,000 miles: cost = " + storages[0]["storage"][0]);
}
else {
  console.log("No path has been found");
}

console.log(path);
