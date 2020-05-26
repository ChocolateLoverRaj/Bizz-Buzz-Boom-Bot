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
client.on('message', async msg => {
    switch (msg.channel.id) {
        case config.channels.bizzBuzzBoom:
            //console.log(msg.cleanContent)
            bizzBuzzBoom.input(msg);
            break;
    }
});

//Init
bot.init = function () {
    //Init
    return new Promise((resolve, reject) => {
        client
            .once('ready', () => {
                bizzBuzzBoom.init(client)
                    .then(resolve)
                    .catch(reject);
            })
            .login(secrets.token)
            .catch(reject);
    });
}

//Export the module
module.exports = bot;