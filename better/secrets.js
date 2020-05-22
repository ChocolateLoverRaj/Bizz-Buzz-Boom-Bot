//File for loading secrets

//Dependancies
const fs = require('fs');
const path = require('path');
const secretsPath = path.join(__dirname, "./secrets.json");

//The function to export
module.exports = function () {
    if (fs.existsSync(secretsPath)) {
        return require("./secrets.json");
    }
    else {
        return process.env;
    }
}