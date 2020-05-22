//Coffee wakes up the dino and prevents it for sleeping

//Dependancies
//Node.js Modules
const http = require('http');

//My Modules
const config = require("./config");

//Coffee module
const coffee = {};

//Make a request to ourself
coffee.wakeUp = function () {
    var req = http.request(config.domain);
    req.on("response", res => {
        if (res.statusCode !== 200) {
            console.log("Couldn't drink coffee.");
        }
        setTimeout(coffee.wakeUp, 1000 * 60);
    });
    req.on("error", e => {
        console.log("Error drinking coffee.");
        setTimeout(coffee.wakeUp, 1000 * 60);
    });
    req.end();
}

//Start loop if in production
coffee.init = function () {
    return new Promise((resolve, reject) => {
        if (config.production) {
            const server = http.createServer((req, res) => {
                res.writeHead(200);
                res.setHeader("contentType", "text/html");
                res.end(`<h1>Link to GitHub: </a href="${config.githubLink}">${config.githubLink}</h1>`);
            })
            server.listen(process.env.PORT, () => {
                resolve(true);
            });
            setTimeout(coffee.wakeUp, 1000 * 60);
        }
        else{
            resolve(false);
        }
    });
};

//Export the module
module.exports = coffee;