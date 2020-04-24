//File for loading secrets

//Dependancies
const fs = require('fs');
const path = require('path');
const secretsPath = path.join(__dirname, "./secrets.json");

function Secrets() {
    if (fs.existsSync(secretsPath)) {
        return require("./secrets.json");
    }
    else {
        return process.env;
    }
}

//Export the module
module.exports = Secrets;