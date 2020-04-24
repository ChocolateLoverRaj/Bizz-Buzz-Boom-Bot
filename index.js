//Main File
const Discord = require('discord.js');
const client = new Discord.Client();
const Secrets = require("./secrets")();

console.log("Loggin in.")

client.on('ready', () => {
    console.log("Successfully logged in.");
});

client.login(Secrets.token.trim());