//Main File

//Node.js Dependancies
const EventEmitter = require('events').EventEmitter;

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

var tournamentRunning = true;
var myChannel;
var myGuild;

var numToSay;
var players;
var turn;

const tournament = new EventEmitter();

function asnycTournamentManager() {
    function checkStart() {
        if (timerReady && playersJoining == 0) {
            tournament.emit("readyToStart");
        }
    }
    var timerReady = true;
    var playersJoining = 0;
    tournament.on("timer", ready => {
        timerReady = ready;
        checkStart();
    });
    tournament.on("players", ready => {
        if (ready) {
            playersJoining--;
        }
        else {
            playersJoining++;
        }
        checkStart();
    });
}
tournament.once("connect", asnycTournamentManager);

client.on('ready', () => {
    console.log("Successfully logged in.");

    //Set the guild
    myGuild = client.guilds.resolve("691793782466674718");

    //Set bizz buzz boom channel
    myChannel = client.channels.fetch("703279246562557973")
        .then(channel => {
            console.log("Successfuly fetched my channel.");
            myChannel = channel;
            channel.send("Bizz Buzz Boom Bot Is Online.");
            tournament.emit("connect");
        })
        .catch(() => {
            console.error("Couldn't fetch main channel");
        });
});

function updateRestartMessage(msg, minutesLeft, time) {
    setTimeout(() => {
        if (minutesLeft > 0) {
            msg.edit("Everyone has " + minutesLeft + " minutes to join tournaments. Join by saying 'join'");
        }
        else {
            msg.edit("Times up! You cannot join anymore. Starting game.");
            tournamentRunning = true;

            tournament.once("readyToStart", () => {
                info.findOneAndUpdate(
                    {},
                    {
                        $set: {
                            numToSay: 1,
                            turn: 0,
                            started: true
                        }
                    },
                    (err, res) => {
                        if (!err && res && res.ok) {
                            if (res.value.players.length > 0) {
                                numToSay = 1;
                                turn = 0;
                                players = res.value.players;

                                var playerList = "";
                                for (var i = 0; i < res.value.players.length; i++) {
                                    var player = myGuild.member(res.value.players[i]);
                                    playerList += player.displayName + "\n";
                                };

                                myChannel.send("Tournament has officially started." + "\n\n" + "Here is the order:" + "\n\n" + playerList);
                            }
                            else {
                                myChannel.send("No one wins because no one joined. Tournament abandoned.");
                            }
                        }
                        else {
                            console.log(err);
                            myChannel.send("Tournament start failed.");
                        }
                    });
            });

            //Emit timer status
            tournament.emit("timer", true);
        }
    }, time - Date.now());
};

tournament.once("connect", () => {
    client.on('message', msg => {
        //Check that the message isn't from us and it's in our channel
        if (!msg.author.bot && msg.channel.name == "bizz-buzz-boom") {
            if (msg.content.trim().toLowerCase() == "restart") {
                msg.reply("Attempting To Restarting Tournament");

                info.findOneAndUpdate({}, {
                    $set: {
                        started: false,
                        players: []
                    }
                }, err => {
                    if (!err) {
                        msg.reply("Successfully Restarted Tournament");

                        //Set timer status
                        tournament.emit("timer", false);

                        //Schedule it to keep doing this until 0 minutes
                        msg.channel.send("Loading...")
                            .then(msg => {
                                tournamentRunning = false;

                                var startTime = Date.now();
                                var minutesLeft = 5;
                                var iteration = 0;
                                while (minutesLeft >= 0) {
                                    updateRestartMessage(msg, minutesLeft, startTime + iteration * 1000 * 60);
                                    minutesLeft--;
                                    iteration++;
                                }
                            })
                            .catch(console.error);
                    }
                    else {
                        msg.reply("Couldn't Restart Tournament");
                    }
                });
            }
            else if (msg.content.trim().toLowerCase() == "join") {
                if (!tournamentRunning) {
                    msg.reply("Attempting to add you to the game...");

                    //Set player status
                    tournament.emit("players", false);

                    info.findOneAndUpdate(
                        {
                            players: {
                                $nin: [msg.author.id]
                            },
                        },
                        {
                            $push: {
                                players: msg.author.id
                            }
                        },
                        (err, res) => {
                            if (!err && res) {
                                if (res.lastErrorObject.n == 1) {
                                    myChannel.send(msg.author.username + " has joined the tournament.");
                                }
                                else {
                                    msg.reply("You are already registered in the tournament.");
                                }
                            }
                            else {
                                msg.reply("Failed to join you.");
                            }

                            //Set player status
                            tournament.emit("players", true);
                        });
                }
                else {
                    msg.reply("You are not allowed to join.");
                }
            }
            else {
                if (tournamentRunning) {
                    
                }
                else {
                    msg.reply("Unkown Command");
                }
            }
        }
    });
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
