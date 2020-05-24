//Handles commands, like npm's commands.

//Dependancies
const Discord = require('discord.js');

const inputRegex = /^((^| )([a-zA-Z]+))+(\s*((-[a-zA-Z](=[\w:,]+)?)|(--[a-zA-Z]+(=[\w:,]+)?)|([a-zA-Z]+))|)*$/s;
const flagRemoveRegex = /((-[a-zA-Z](=[\w:,]+)?)|(--[a-zA-Z]+(=[\w:,]+)?))/gs;
const flagRegex = /((-[a-zA-Z](=[\w:,]+)?)|(--[a-zA-Z]+(=[\w:,]+)?))/s;

//Command class to export
module.exports = class {
    constructor(helpCommand = true) {
        this.commands = new Map();
        if(helpCommand){
            var commandMap = this.commands;
            this.command("help", "Displays this list of commands.", undefined, function(msg, args, flags){
                var embed = new Discord.MessageEmbed();
                embed.setTitle("Bizz Buzz Boom Bot Commands.");
                for(const [key, value] of commandMap.entries()){
                    embed.addField(key, value.discription);
                }
                msg.reply(embed);
            });
        }
    }
    command(names, discription, shortFlags = new Map(), handler) {
        if (typeof discription === 'string' && shortFlags instanceof Map && typeof handler === 'function' && handler.length === 3) {
            var smartHandler = function (msg, args, sFlags, fFlags) {
                var fullFormedFlags = new Map();
                sFlags.forEach(flag => {
                    if (shortFlags.has(flag.name)) {
                        flag.name = shortFlags.get(flag.name);
                        fullFormedFlags.set(flag.name, flag.value);
                    }
                });
                fFlags.forEach(flag => {
                    fullFormedFlags.set(flag.name, flag.value);
                });
                handler(msg, args, fullFormedFlags);
            };
            var commandValue = {
                handler: smartHandler,
                discription: discription
            }
            if (typeof names === 'string') {
                this.commands.set(names, commandValue);
            }
            else if (names instanceof Array) {
                names.forEach(name => {
                    this.commands.set(name, commandValue);
                });
            }
            else {
                throw new TypeError("name must be a string or array of strings.");
            }
        }
        else {
            throw new TypeError("Invalid arguements.");
        }
        return this;
    }
    input(msg) {
        var content = msg.content.trim();
        if (inputRegex.test(content)) {
            var flagLessContent = content.replace(flagRemoveRegex, '');
            flagLessContent = flagLessContent.replace(/\s+/g, ' ');
            var words = flagLessContent.split(' ');
            var searchStr = '';
            var args = [];
            var foundStr = false;
            for (var i = 0; i < words.length; i++) {
                searchStr = (searchStr + ' ' + words[i]).trim();
                if (!foundStr) {
                    if (this.commands.has(searchStr)) {
                        foundStr = searchStr;
                    }
                }
                else {
                    args.push(words[i]);
                }
            }
            if (foundStr) {
                var shortFlags = [];
                var fullFlags = [];
                //Find the flags
                var rest = content;
                while(true){
                    var match = flagRegex.exec(rest);
                    if(match === null){
                        break;
                    }
                    else{
                        var flag = match[0].split('=');
                        if(match[0].includes('--')){
                            fullFlags.push({name: flag[0].substring(2), value: flag[1]});
                        }
                        else{
                            shortFlags.push({name: flag[0].substring(1), value: flag[1]});
                        }
                        rest = rest.substring(match.index + match[0].length);
                    }
                }
                this.commands.get(foundStr).handler(msg, args, shortFlags, fullFlags);
            }
        }
        return this;
    }
}