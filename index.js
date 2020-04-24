//Main File
const Discord = require('discord.js');
const client = new Discord.Client();
const Secrets = require("./secrets")();

console.log("Connecting", Secrets);