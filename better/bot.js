//Communicate with Discord

//Dependancies
//Npm Modules
const Discord = require("discord.js");

//My Modules
const secrets = require("./secrets")();
const Command = require("./command");

//Bot module
const bot = {};

const client = new Discord.Client();

const command = new Command();

command.command(["create", "new"], "Create a game.", new Map().set("f", "fun"), (args, flags) => {
    console.log("f", flags.get("fun"));
});

//Handle message
client.on('message', msg => {
    command.input(msg);
});

//Init
bot.init = function () {
    return new Promise((resolve, reject) => {
        client
            .once('ready', () => {
                resolve();
            })
            .login(secrets.token)
            .catch(reject);
    });
}

//Export the module
module.exports = bot;