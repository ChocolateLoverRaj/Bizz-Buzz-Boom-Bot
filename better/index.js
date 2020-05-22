//Primary File For Bot

//Dependancies
const coffee = require("./coffee");
const bot = require("./bot");

//Initialize
coffee.init().then(started => {
    console.log("Started server.")
    bot.init()
        .then(() => {
            console.log("Logged in to discord.");
        })
        .catch(err => {
            console.log("Couldn't login to discord.");
        });
});