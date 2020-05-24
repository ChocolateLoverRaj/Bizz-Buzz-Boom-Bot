//Bizz Buzz Boom Game

//Dependancies
const CommandManager = require("../command");
const mongodbhelper = require("../mongodbhelper");
const config = require("../config");

const manager = new CommandManager();

const mappingRegex = /^(\d+:([a-z]\w*)(?!(.*:(\2|last)(,|$).*))(,|$))+$/i;
const presetNameRegex = /^\w+$/is;

var gameCreated = false;
var gameStarted = false;
var players = [];

manager.command("preset", "Create a preset. Example: preset normal --mapping=2:bizz,3:buzz,5:boom --exists=update --time=60", new Map().set("m", "mapping").set("e", "exists").set("t", "time"), (msg, args, flags) => {
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
                    storePreset();
                }
                else {
                    msg.reply("Bad syntax for mapping.");
                }
            }
            else {
                mapping = config.bizzBuzzBoom.defaultPreset.mapping;
                storePreset();
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
                time: time
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
                    exists = null;
                    break;
            }
        }
        else {
            msg.reply("time must be a positive integer (in seconds).");
        }
    }
});

manager.command("create", "Create a game. Example: create --preset=myPreset", new Map().set("p", "preset"), (msg, args, flags) => {
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
    function createGame(){
        gameCreated = true;
        msg.reply("Created game.");
        msg.channel.send("A new game of bizz buzz boom has been created.");
    }
});

manager.command("join", "Join the game. Example: join", undefined, (msg, args, flags) => {
    if(gameCreated){
        if(!gameStarted){
            console.log("hi")
        console.log(msg.client.guilds.resolve("691793782466674718").member(msg.author.id).displayName);
        }
        else{
            msg.reply("Game has already started.");
        }
    }
    else{
        msg.reply("There is no game currently.");
    }
});

//Export the manager
module.exports = manager;