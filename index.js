//Main File

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

client.on('ready', () => {
    console.log("Successfully logged in.");
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
