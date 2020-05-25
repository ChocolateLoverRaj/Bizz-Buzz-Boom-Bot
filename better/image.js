//Create images
const { createCanvas, loadImage, Image } = require('canvas');
const fs = require('fs');
const fsPromises = fs.promises;
const path = require('path');

//Image module
const lib = {};

const imagePath = "./res/test.png";
const finalImagePath = "./res/output.png";

//Uri to png
lib.uriToPng = function (uri) {
    return new Buffer.from(uri.split(',')[1], 'base64');
}

//Ctx for testing
const testCtx = createCanvas(1, 1).getContext('2d');
testCtx.font = "32px Sans";
testCtx.fillStyle = "green";

//Create player list
lib.createPlayerList = async function (players) {
    var maxWidth = Math.max.apply(undefined, players.map(getNameWidth));
    var canvas = createCanvas(64 + 16 + maxWidth, players.length * (64 + 16));
    var ctx = canvas.getContext('2d');

    ctx.font = "32px Sans";
    ctx.fillStyle = "green";

    async function drawPngImage(player) {
        var cachePath = path.join(__dirname, `./cache/${player.id}.png`);
        var cache = await fsPromises.stat(cachePath);
        var url;
        if(cache.isFile()){
            url = cachePath;
        }
        else{
            url = player.url.replace(path.extname(player.url), ".png?size=64");
        }
        console.log(url);
        return await loadImage(url);
    };

    function getNameWidth(player) {
        console.log(testCtx.measureText(player.name).width, player.name)
        return testCtx.measureText(player.name).width;
    }

    var images = await Promise.all(players.map(drawPngImage));
    for (var i = 0; i < players.length; i++) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(32, (64 + 16) * i + 32, 32, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(images[i], 0, (64 + 16) * i, 64, 64);
        ctx.restore();
        ctx.fillText(players[i].name, 64 + 16, 48 + (64 + 16) * i);
    }
    await fsPromises.writeFile("./res/canvas.png", lib.uriToPng(canvas.toDataURL()));
    console.log("done making player list", canvas.width, canvas.height, maxWidth);
}

lib.createPlayerList([
    {
        url: "https://cdn.discordapp.com/embed/avatars/4.png",
        name: "<programmer>Rajas</programmer>",
        id: "a"
    },
    {
        url: "https://cdn.discordapp.com/avatars/539505577286434816/bd289c17a1dff59e88df42b73bde2c22.webp",
        name: "Secynt",
        id: "b"
    }
]);

async function help() {
    var uri = await textToImage.generate("<programmer>Rajas</programmer>", {
        bgColor: "transparent",
        textColor: "green"
    });
    await fsPromises.writeFile(imagePath, new Buffer(uri.split(',')[1], 'base64'));
    var dimensions = await sizeOf(imagePath);
    var canvas = createCanvas(dimensions.width, dimensions.height);
    var ctx = canvas.getContext('2d');
    var image = await loadImage(imagePath);
    ctx.drawImage(image, 0, 0, dimensions.width, dimensions.height);
    await fsPromises.writeFile(finalImagePath, new Buffer(canvas.toDataURL().split(',')[1], 'base64'));
};

//Export the module
module.exports = lib;