//Handles commands, like npm's commands.

const inputRegex = /^((^| )([a-zA-Z]+))+(\s*((-[a-zA-Z](=\w+)?)|(--[a-zA-Z]+(=\w+)?)|([a-zA-Z]+))|)*$/s;
const flagRemoveRegex = /((-[a-zA-Z](=\w+)?)|(--[a-zA-Z]+(=\w+)?))/gs;
const flagRegex = /((-[a-zA-Z](=\w+)?)|(--[a-zA-Z]+(=\w+)?))/s;

//Command class to export
module.exports = class {
    constructor() {
        this.commands = new Map();
    }
    command(names, discription, shortFlags, handler) {
        if (typeof discription === 'string' && shortFlags instanceof Map && typeof handler === 'function' && handler.length === 2) {
            var smartHandler = function (args, sFlags, fFlags) {
                sFlags.forEach(flag => {
                    if (shortFlags.has(flag.name)) {
                        flag.name = shortFlags.get(flag.name);
                        fFlags[flag] = flag;
                    }
                });
                handler(args, fFlags);
            }
            if (typeof names === 'string') {
                this.commands.set(names, smartHandler);
            }
            else if (names instanceof Array) {
                names.forEach(name => {
                    this.commands.set(name, smartHandler);
                });
            }
            else {
                throw new TypeError("name must be a string or array of strings.");
            }
        }
        else {
            throw new TypeError("Invalid arguements.");
        }
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
                        //TODO Add the flag and figure out if it's the short regex or the full regex and add it.
                        rest = rest.substring(match.index, match.index + match[0].length);
                    }
                }
                this.commands.get(foundStr)(args, shortFlags, fullFlags);
            }
            else {
                //TODO help command
                console.log("unknown command.");
            }
        }
        else {
            //TODO add a help feature.
            console.log("baaad")
        }
    }
}