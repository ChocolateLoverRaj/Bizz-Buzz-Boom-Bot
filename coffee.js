//Coffee wakes up the dino and prevents it for sleeping

//Dependancies
const http = require('http');

//Make a request to ourself
function wakeUp() {
    var req = http.request("http://bizz-buzz-boom-bot.herokuapp.com/");
    req.on("response", res => {
        if (res.statusCode == 200) {
            console.log("Successfuly drank coffee.");
        }
        else {
            console.log("Couldn't drink coffee.");
        }
        setTimeout(wakeUp, 1000 * 60);
    });
    req.on("error", e => {
        console.log("Error drinking coffee.");
        setTimeout(wakeUp, 1000 * 60);
    });
    req.end();
}

//Start loop
console.log("working");
setTimeout(wakeUp, 1000 * 60);