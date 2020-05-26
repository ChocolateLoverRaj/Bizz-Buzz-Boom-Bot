//Bizz Buzz Boom Game

//Dependancies
//Npm modules
const Discord = require('discord.js');

//My Modules
const CommandManager = require("../command");
const mongodbhelper = require("../mongodbhelper");
const config = require("../config");
const image = require("../image");

const manager = new CommandManager();

const mappingRegex = /^(\d+:([a-z]\w*)(?!(.*:(\2|last)(,|$).*))(,|$))+$/i;
const presetNameRegex = /^\w+$/is;

var gameCreated = false;
var gamePreset;
var gameLeader;
var gameStarted = false;
var players = [];
var playersEmbed = false;

const presetMap = new Map()
    .set("m", "mapping")
    .set("e", "exists")
    .set("t", "time")
    .set("q", "quit");
manager.command("preset", "Create a preset. Example: preset normal --mapping=2:bizz,3:buzz,5:boom --exists=update --time=60", presetMap, (msg, args, flags) => {
    var presetName = args[0];
    if (typeof presetName === "string" && presetNameRegex.test(presetName)) {
        if (presetName !== config.bizzBuzzBoom.defaultPreset.name) {
            var mapping = {};
            if (flags.has("mapping")) {
                var mappingStr = flags.get("mapping");
                //Parse mapping
                if (mappingRegex.test(mappingStr)) {
                    mappingStr.split(",").forEach(saying => {
                        var [key, value] = saying.split(":");
                        mapping[key] = value;
                    });
                    validateQuit();
                }
                else {
                    msg.reply("Bad syntax for mapping.");
                }
            }
            else {
                mapping = config.bizzBuzzBoom.defaultPreset.mapping;
                validateQuit();
            }
            function validateQuit() {
                var quit = flags.get("quit");
                if (flags.has("quit")) {
                    switch (quit) {
                        case "true":
                            quit = true;
                            storePreset();
                            break;
                        case "false":
                            quit = false;
                            storePreset();
                            break;
                        default:
                            msg.reply("quit flag must be either true or false.")
                            break;
                    }
                }
                else {
                    quit = config.bizzBuzzBoom.defaultPreset.quit;
                    storePreset();
                }
                function storePreset() {
                    var time = config.bizzBuzzBoom.defaultPreset.time;
                    if (flags.has("time")) {
                        time = parseInt(flags.get("time"));
                    }
                    if (Number.isSafeInteger(time) && time > 0) {
                        var exists = flags.get("exists") || "cancel";
                        var preset = {
                            name: presetName,
                            mapping: mapping,
                            time: time,
                            quit: quit
                        };
                        var presets = mongodbhelper.collection("bizz-buzz-boom-presets");
                        switch (exists) {
                            case "replace":
                                presets.findOneAndReplace({ name: presetName }, preset, { upsert: true, returnOriginal: true }, (err, res) => {
                                    if (!err && res && res.ok) {
                                        if (res.value === null) {
                                            msg.reply("Successfully added preset.");
                                        }
                                        else {
                                            msg.reply("Successfully replaced preset.");
                                        }
                                    }
                                    else {
                                        msg.reply("Error saving preset.");
                                    }
                                });
                                break;
                            case "cancel":
                                presets.findOne({ name: presetName }, (err, res) => {
                                    if (res === null) {
                                        presets.insertOne(preset, (err, res) => {
                                            if (!err && res && res.result.ok) {
                                                msg.reply("Successfully added preset.");
                                            }
                                            else {
                                                msg.reply("Error saving preset.");
                                            }
                                        });
                                    }
                                    else {
                                        msg.reply("Canceled creating preset; preset with that name already exists.");
                                    }
                                });
                                break;
                            default:
                                msg.reply("Invalid value for exists flag.");
                                break;
                        }
                    }
                    else {
                        msg.reply("time must be a positive integer (in seconds).");
                    }
                }
            }
        }
        else {
            msg.reply(`The preset name ${config.bizzBuzzBoom.defaultPreset.name} is reserved as a built in preset. It cannot be changed or overwritten.`);
        }
    }
    else {
        msg.reply("First arguement must be only letters and underscores.");
        console.log(presetName)
    }

});

manager.command("create", "Create a game. Example: create --preset=myPreset --abandon", new Map().set("p", "preset").set("a", "abandon"), (msg, args, flags) => {
    if (!gameCreated || flags.has("abandon")) {
        var preset = flags.get("preset");
        //Retrieve the preset from database
        if (preset) {
            mongodbhelper.collection("bizz-buzz-boom-presets").findOne({ name: preset }, (err, res) => {
                if (!err) {
                    if (res) {
                        preset = res;
                        createGame();
                    }
                    else {
                        msg.reply("Preset with that name does not exist.");
                    }
                }
                else {
                    msg.reply("Error getting preset.");
                }
            });
        }
        else {
            preset = config.bizzBuzzBoom.defaultPreset;
            createGame();
        }
        function createGame() {
            gameCreated = true;
            gamePreset = preset;
            gameLeader = msg.author.id;
            gameStarted = false;
            players = [msg.author.id];
            playersEmbed = false;
            msg.reply("Created game. You have joined automatically because you are the leader. To start the game, use the \`start\` command.");
            msg.channel.send("Who wants to play some Bizz Buzz Boom? Use the \`join\` command.");
        }
    }
    else {
        msg.reply("There is already a game created. To abandon that game, use the \`--abandon\` flag.");
    }
});

manager.command("join", "Join the game.", undefined, (msg, args, flags) => {
    if (gameCreated) {
        if (!gameStarted) {
            var id = msg.author.id, nick = msg.guild.member(msg.author.id).displayName;
            if (!players.includes(id)) {
                players.push(id);
                playersEmbed = false;
                msg.reply("Added you to the game.");
            }
            else {
                msg.reply("You are already in the game.");
            }
        }
        else {
            msg.reply("Game has already started.");
        }
    }
    else {
        msg.reply("There is no game currently.");
    }
});

manager.command("leave", "Leave a game.", undefined, (msg, args, flags) => {
    if (gameCreated) {
        var id = msg.author.id;
        if (players.includes(id)) {
            if (gameStarted) {
                if (gamePreset.quit) {
                    leave();
                }
                else {
                    msg.reply("You cannot leave because the game rules forbid you to leave after the game starts.");
                }
            }
            else {
                if (gameLeader !== msg.author.id) {
                    leave();
                }
                else {
                    msg.reply("You are the game leader. You cannot leave because if you do others cannot start the game. To abandom the game, use the \`abandom\` command.");
                }
            }
            function leave() {
                var newPlayers = [];
                players.forEach(player => {
                    if (player !== id) {
                        newPlayers.push(player);
                    }
                });
                players = newPlayers;
                playersEmbed = false;
                msg.reply("Successfully removed you from the game.");
            }
        }
        else {
            msg.reply("You aren't in a game.");
        }
    }
    else {
        msg.reply("Cannot leave game; there is no game.");
    }
});

manager.command("players", "List players in a game.", undefined, (msg, args, flags) => {
    if (gameCreated) {
        if (!playersEmbed) {
            function createPlayer(id) {
                var member = msg.guild.member(id);
                return {
                    name: member.displayName,
                    id: id,
                    color: member.displayHexColor,
                    url: member.user.displayAvatarURL()
                };
            }
            image.createPlayerList(players.map(createPlayer))
                .then(url => {
                    var embed = new Discord.MessageEmbed()
                        .setTitle("Bizz Buzz Boom Players")
                        .setImage(url);
                    playersEmbed = embed;
                    msg.reply(embed);
                })
                .catch(err => {
                    msg.reply("Couldn't get players image.");
                });
        }
        else {
            msg.reply(playersEmbed);
        }
    }
    else {
        msg.reply("Game hasn't been created yet.");
    }
});

manager.command("start", "Start a game.", undefined, (msg, args, flags) => {
    if (gameCreated) {
        if (!gameStarted) {
            var id = msg.author.id;
            if (players.includes(id)) {
                if (gameLeader === id) {
                    gameStarted = true;
                    msg.reply("Starting game... Feature yet to be made though.");
                }
                else {
                    msg.reply("You must be the game leader to start the game.");
                    msg.channel.send(`<@${gameLeader}>, Players are requesting you to start the game.`);
                }
            }
            else {
                msg.reply("You aren't in the game. Use the \`join\` command to join the game.");
            }
        }
        else {
            msg.reply("The game has already been started.");
        }
    }
    else {
        msg.reply("There is no game.");
    }
});

//Export the manager
module.exports = manager;