//Primary File For Bot

//Dependancies
const coffee = require("./coffee");
const mongodbhelper = require("./mongodbhelper");
const bot = require("./bot");
const image = require("./image");

//Async Init
async function init(){
    var coffeePromise = coffee.init().then(started => {
        if(started){
            console.log("Successfully Started Server.");
        }
        else{
            console.log("No need to start server.");
        }
    });
    var mongodbPromise = mongodbhelper.init().then(() => {
        console.log("Connected to mLab mongodb.");
    });
    var imagePromise = image.init().then(() => {
        console.log("Connected to cloudinary.");
    });
    
    //Await things that need to be done before Discord login
    await Promise.all([coffeePromise, mongodbPromise, imagePromise]);

    //Start bot
    await bot.init();
    console.log("Successfully started bot.");
};

//Init
init();