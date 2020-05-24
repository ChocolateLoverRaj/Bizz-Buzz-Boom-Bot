//Bizz Buzz Boom Game

//Dependancies
const CommandManager = require("../command");
const mongodbhelper = require("../mongodbhelper");
const config = require("../config");

const manager = new CommandManager();

const mappingRegex = /^(\d+:([a-z]\w*)(?!(.*:(\2|last)(,|$).*))(,|$))+$/i;
const presetNameRegex = /^\w+$/is;

manager.command("preset", "Create a preset. Example: preset normal --mapping=2:bizz,3:buzz,5:boom --exists=update", new Map().set("m", "mapping").set("e", "exists"), (msg, args, flags) => {
    var presetName = args[0];
    if (typeof presetName === "string" && presetNameRegex.test(presetName)) {
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
            mapping = config.bizzBuzzBoom.defaultPreset;
            storePreset();
        }
    }
    else {
        msg.reply("First arguement must be only letters and underscores.");
        console.log(presetName)
    }
    function storePreset() {
        var exists = flags.get("exists") || "cancel";
        var preset = {
            name: presetName,
            mapping: mapping
        };
        var presets = mongodbhelper.collection("bizz-buzz-boom-presets");
        switch (exists) {
            case "replace":
                presets.findOneAndReplace({ name: presetName }, { $set: preset }, { upsert: true, returnOriginal: true }, (err, res) => {
                    if (!err && res && res.ok) {
                        if(res.value === null){
                            msg.reply("Successfully added preset.");
                        }
                        else{
                            msg.reply("Successfully replaced preset.");
                        }
                    }
                    else{
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
});

manager.command("create", "Create a game. Example: create --preset=myPreset", new Map().set("p", "preset"), (msg, args, flags) => {
    console.log("p", flags.get("preset"));
});

//Export the manager
module.exports = manager;