//Communicate with Discord

//Dependancies
//Npm Modules
const Discord = require("discord.js");

//My Modules
//Utilities
const secrets = require("./secrets")();
const config = require("./config");

//Games
const bizzBuzzBoom = require("./games/bizz buzz boom");

//Bot module
const bot = {};

const client = new Discord.Client();

//Handle message
client.on('message', msg => {
    switch(msg.channel.id){
        case config.channels.bizzBuzzBoom:
            bizzBuzzBoom.input(msg);
            break;
    }
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