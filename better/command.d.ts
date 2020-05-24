import Discord = require('discord.js');

type handler = (msg: Discord.Message, args: Array<String>, flags: Map<string, string>) => void;

declare class CommandManager {
    constructor(helpCommand?: boolean);

    command(name: string, discription: string, shortFlags: Map<string, string>, handler: handler): this;
    command(names: Array<string>, discription: string, shortFlags: Map<string, string>, handler: handler): this;

    input(msg: Discord.Message): this;
}

export = CommandManager;