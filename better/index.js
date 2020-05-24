//Primary File For Bot

//Dependancies
const coffee = require("./coffee");
const mongodbhelper = require("./mongodbhelper");
const bot = require("./bot");

//Initialize
coffee.init()
    .then(started => {
        console.log("Started server.")
        mongodbhelper.init()
            .then(() => {
                console.log("Connected to mongodb.");
                bot.init()
                    .then(() => {
                        console.log("Logged in to discord.");
                    })
                    .catch(err => {
                        console.log("Couldn't login to discord.");
                    });
            })
            .catch(err => {
                console.log("Couldn't connect to mongodb.");
            });
    });