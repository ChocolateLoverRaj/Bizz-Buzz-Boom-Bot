//Main File

//Node.js Dependancies
const EventEmitter = require('events').EventEmitter;
const http = require('http');
const worker_threads = require('worker_threads');
new worker_threads.Worker("./coffee.js");

//Discord dependancies
const Discord = require('discord.js');
const client = new Discord.Client();

//My dependancies
const Secrets = require("./secrets")();
const say = require("./say");

//Mongodb dependancies
const MongoClient = require('mongodb').MongoClient;
const uri = 'mongodb://' + Secrets.mongodbUsername + ':' + Secrets.mongodbPassword + "@" + Secrets.mongodbDomain;
const mongoClient = new MongoClient(uri, { useUnifiedTopology: true, useNewUrlParser: true });
var info;

//Start server so that heroku doesn't automatically close app
if (process.env.PORT) {
    const server = http.createServer((req, res) => {
        res.writeHead(200);
        res.end("Link to GitHub: https://github.com/ChocolateLoverRaj/Bizz-Buzz-Boom-Bot");
    });
    server.listen(process.env.PORT);
    console.log("Empty http server listening on port " + process.env.PORT + ".");
}

var tournamentRunning = false;
var canJoin = false;
var myChannel;
var myGuild;

const syntaxRegex = /(^(((bizz|buzz|boom)(?!(.*\4))($| )){1,3})$(?<!\s))|(^\d+$)/is;

var numToSay;
var players = [];
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

            //Get data
            info.findOne({}, (err, game) => {
                if (!err && game) {
                    if (game.started) {
                        tournamentRunning = true;
                        players = game.players;
                        turn = game.turn;
                        numToSay = game.numToSay;
                        announceTurn();
                    }
                }
                else {
                    myChannel.send("Could not load game.");
                    console.error("Could not load game.");
                }
            });
            tournament.emit("connect");
        })
        .catch(() => {
            console.error("Couldn't fetch main channel");
        });
});

function announceTurn() {
    if (players.length > 1) {
        myChannel.send("It is now " + myGuild.member(players[turn]).displayName + "'s turn.");
    }
    else {
        //Game over. Update database
        info.findOneAndUpdate(
            {},
            {
                $set: {
                    started: false
                }
            },
            (err, res) => {
                var whatToSayToPlayers = "Everyone except " + myGuild.member(players[0]).displayName + " is out. Game over!";
                if (!err && res && res.ok) {
                    tournamentRunning = false;
                    myChannel.send(whatToSayToPlayers);
                }
                else {
                    myChannel.send(whatToSayToPlayers + " Failed to update server.");
                }
            });
    }
}
function updateRestartMessage(msg, minutesLeft, time) {
    setTimeout(() => {
        if (minutesLeft > 0) {
            msg.edit("Everyone has " + minutesLeft + " minutes to join tournaments. Join by saying 'join'");
        }
        else {
            msg.edit("Times up! You cannot join anymore. Starting game.");
            tournamentRunning = true;
            canJoin = false;

            tournament.once("readyToStart", () => {
                info.findOneAndUpdate(
                    {},
                    {
                        $set: {
                            numToSay: 1,
                            turn: 0,
                            lastAnswer: "You are the first person to answer.",
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

                                announceTurn();
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

function checkAnswer(msg, whatTheySaid) {
    //Delete the message
    function deleteMessage() {
        if (deleteableMessage) {
            deleteableMessage.delete({ reason: "So people can't cheat." });
            deleteableMessage = undefined;
        }
        msg.delete({ reason: "So people can't cheat." });
    };

    //Check if they said it right
    if (say.checkMessage(whatTheySaid, numToSay)) {
        //Update the database
        info.findOneAndUpdate(
            {},
            {
                $set: {
                    turn: turn + 1 < players.length ? turn + 1 : 0,
                    lastAnswer: myGuild.member(msg.author.id).displayName + " said " + whatTheySaid + "."
                },
                $inc: {
                    numToSay: 1
                }
            },
            {
                returnOriginal: false
            },
            (err, res) => {
                if (!err && res && res.ok) {
                    turn = res.value.turn;
                    numToSay = res.value.numToSay;
                    msg.reply("That is correct.");
                    deleteMessage();
                    announceTurn();
                }
                else {
                    msg.reply("Failed to update number.");
                }
            });
    }
    else {
        //Update the database
        var newPlayers = Array.from(players);
        newPlayers.splice(newPlayers.indexOf(msg.author.id), 1);
        var newTurn = turn;
        if (turn == newPlayers.length) {
            newTurn = 0;
        }
        info.findOneAndUpdate(
            {},
            {
                $set: {
                    players: newPlayers,
                    turn: newTurn
                }
            },
            { returnOriginal: false },
            (err, res) => {
                if (!err && res && res.ok) {
                    players = newPlayers;
                    turn = newTurn;
                    msg.reply("Unfortunately, that is incorrect.");
                    myChannel.send(myGuild.member(msg.author.id).displayName + " is out because they answered incorrectly.");
                    deleteMessage();
                    announceTurn();
                }
                else {
                    msg.reply("Failed to update number.");
                }
            });
    }
}

var deleteableMessage;

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
                                canJoin = true;

                                var startTime = Date.now();
                                var minutesLeft = 2;
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
                if (canJoin) {
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
                        {
                            returnOriginal: false
                        },
                        (err, res) => {
                            if (!err && res) {
                                if (res.lastErrorObject.n == 1) {
                                    players = res.value.players;
                                    myChannel.send(myGuild.member(msg.author.id).displayName + " has joined the tournament.");
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
            else if (msg.content.trim().toLowerCase() == "leave") {
                if (canJoin) {
                    if (players.indexOf(msg.author.id) > -1) {
                        //Set player status
                        tournament.emit("players", false);

                        var newPlayers = Array.from(players);
                        newPlayers.splice(newPlayers.indexOf(msg.author.id), 1);
                        info.findOneAndUpdate(
                            {},
                            {
                                $set: {
                                    players: newPlayers
                                }
                            },
                            {
                                returnOriginal: false
                            },
                            (err, res) => {
                                if (!err && res) {
                                    players = newPlayers;
                                    myChannel.send(myGuild.member(msg.author.id).displayName + " has left the tournament.");
                                }
                                else {
                                    msg.reply("Failed to join you.");
                                }

                                //Set player status
                                tournament.emit("players", true);
                            });
                    }
                    else {
                        msg.reply("You aren't in the tournament.");
                    }
                }
                else {
                    msg.reply("You are not allowed to leave or join.");
                }
            }
            else if (msg.content.trim().split(" ")[0].toLowerCase() == "answer") {
                if (tournamentRunning) {
                    if (players.includes(msg.author.id)) {
                        if (players[turn] == msg.author.id) {
                            var whatTheySaid = msg.content.substr(msg.content.indexOf(" ") + 1);
                            //Check if what they said makes sense
                            if (syntaxRegex.test(whatTheySaid)) {
                                checkAnswer(msg, whatTheySaid);
                            }
                            else {
                                msg.reply("Bad snytax.");
                            }
                        }
                        else {
                            msg.reply("It isn't your turn.");
                        }
                    }
                    else {
                        msg.reply("You aren't in the tournament.");
                    }
                }
                else {
                    msg.reply("Tournament isn't running");
                }
            }
            else if (msg.content.trim().toLowerCase() == "last") {
                if (tournamentRunning) {
                    if (players.includes(msg.author.id)) {
                        if (players[turn] == msg.author.id) {
                            //Get the last answer
                            info.findOne({}, (err, game) => {
                                if (!err && game) {
                                    msg.reply(game.lastAnswer)
                                        .then(msg => {
                                            deleteableMessage = msg;
                                        })
                                        .catch(e => {
                                            console.log(e);
                                        });
                                }
                                else {
                                    msg.reply("Failed to retrieve last answer.");
                                }
                            });
                        }
                        else {
                            msg.reply("It isn't your turn.");
                        }
                    }
                    else {
                        msg.reply("You aren't in the tournament.");
                    }
                }
                else {
                    msg.reply("Tournament isn't running");
                }
            }
            else if (msg.content.trim().toLowerCase() == "turn") {
                if (tournamentRunning) {
                    msg.reply("It is " + myGuild.member(players[turn]).displayName + "'s turn.");
                }
                else {
                    msg.reply("Tournament isn't running");
                }
            }
            else {
                if (tournamentRunning && players[turn] == msg.author.id && syntaxRegex.test(msg.content.trim())) {
                    checkAnswer(msg, msg.content.trim());
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
