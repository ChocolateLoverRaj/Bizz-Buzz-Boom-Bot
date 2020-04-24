//Main File

//Discord dependancies
const Discord = require('discord.js');
const client = new Discord.Client();

//My dependancies
const Secrets = require("./secrets")();

//Mongodb dependancies
const MongoClient = require('mongodb').MongoClient;
const uri = 'mongodb://' + Secrets.mongodbUsername + ':' + Secrets.mongodbPassword + "@" + Secrets.mongodbDomain;
const mongoClient = new MongoClient(uri, { useUnifiedTopology: true, useNewUrlParser: true });
var info;

client.on('ready', () => {
    console.log("Successfully logged in.");
});

function updateRestartMessage(msg, minutesLeft) {
    msg.edit("Everyone has " + minutesLeft + " minutes to join tournaments. Join by saying 'join'");
};

client.on('message', msg => {
    //Check that the message isn't from us and it's in our channel
    if (!msg.author.bot && msg.channel.name == "bizz-buzz-boom") {
        if (msg.content.trim().toLowerCase() == "restart") {
            msg.reply("Attempting To Restarting Tournament");

            var restartTime = Date.now();

            info.findOneAndUpdate({}, {
                $set: {
                    started: false,
                    players: [],
                    minutesLeft: 5
                }
            }, err => {
                if (!err) {
                    msg.reply("Successfully Restarted Tournament");

                    //Schedule it to keep doing this
                }
                else {
                    msg.reply("Couldn't Restart Tournament");
                }
            });
        }
        else {
            msg.reply("Unkown Command");
        }
    }
});

console.log("Connecting to mongodb.");

mongoClient.connect(err => {
    if (!err) {
        console.log("Successfully connected to mongodb.");

        console.log("Loggin in.");

        info = mongoClient.db("heroku_w8wxzsb7").collection("Info");

        client.login(Secrets.token.trim()).catch(e => {
            console.log("Couldn't log in.");
        });
    }
    else {
        console.log("Error connecting to mongodb.");
    }
});
