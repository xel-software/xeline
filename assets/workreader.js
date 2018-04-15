'use strict'
let fs = require('fs');
const path = require('path')

const demos = [];

function readAll(the_path){
    var contents = fs.readFileSync(the_path, 'utf-8');
    return contents;
}
function readMetadata(the_path){
    var contents = fs.readFileSync(the_path, 'utf-8');
    // extract metadata
    var uarr = contents.split("\n");
    
    var title="";
    var pow_limit=0;
    var pow_price=0;
    var bounty_limit=0;
    var bounty_price=0;
    var iterations=0;
    var timeout=0;
    var callback="";

    for(var i=0; i<uarr.length; ++i){
        try{
            var u = uarr[i];
            // scan as long as the first line without "// metadata" comes
            // console.log("checking" + u);
            if(/\/\/[ ]*metadata\((.*):(.*)\)/g.test(u)==false) break;
            var grp = /\/\/[ ]*metadata\((.*):(.*)\)/g.exec(u);
            // console.log(grp[1] + " = " + grp[2]);
            if(grp[1]=="title") title=grp[2];
            else if(grp[1]=="callback") callback=grp[2];
            else if(grp[1]=="timeout") timeout=parseInt(grp[2]);
            else if(grp[1]=="iterations") iterations=parseInt(grp[2]);
            else if(grp[1]=="pow_limit") pow_limit=parseInt(grp[2]);
            else if(grp[1]=="bounty_limit") bounty_limit=parseInt(grp[2]);
            else if(grp[1]=="pow_price") pow_price=parseFloat(grp[2]);
            else if(grp[1]=="bounty_price") bounty_price=parseInt(grp[2]);
        }catch(e){
            console.log(e);
            break;
        }
    }

    if(title=="") title="Untitled Job";

    if(title!="" && pow_limit>0 && pow_price>0 && bounty_limit>0 && bounty_price>0 && iterations>0 && timeout>0){
        return {"file": the_path,"title":title,"callback":callback,"timeout":timeout,"iterations":iterations,"pow_limit":pow_limit,"pow_price":pow_price,"bounty_limit":bounty_limit,"bounty_price":bounty_price};
    }else{
        return null;
    }
}

function loadDemos(){
    var demopath = path.join(__dirname,"..", 'demos');
    console.log("Reading demopath " + demopath);
    var files = fs.readdirSync(demopath);
    files.forEach(function(file) {
        var metapath = path.join(demopath,file);
        var metadata = readMetadata(metapath);
        if(metadata!=null){
            demos.push(metadata);
        }
    })
}

module.exports.loadDemos = loadDemos;
module.exports.demos = demos;
module.exports.readMetadata=readMetadata;
module.exports.readAll=readAll;