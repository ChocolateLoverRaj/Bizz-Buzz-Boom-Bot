//Create images
//Node.js Modules
const fs = require('fs');
const path = require('path');
const https = require('https');

//Npm Modules
const { createCanvas, loadImage } = require('canvas');

//My Modules
const secrets = require("./secrets")();
const { avatarSize } = require("./config").bizzBuzzBoom;

const fsPromises = fs.promises;
const avatarPadding = avatarSize / 4;
const avatarHalf = avatarSize / 2;

//Image module
const lib = {};

//Uri to png
lib.uriToPng = function (uri) {
    return new Buffer.from(uri.split(',')[1], 'base64');
}

//Ctx for testing
const testCtx = createCanvas(1, 1).getContext('2d');
testCtx.font = `${avatarHalf}px Sans`;

//Initialize and delete cache
lib.init = async function () {
    //Remove folder cache
    var caches = await fsPromises.readdir(path.join(__dirname, "./cache"));

    async function deleteFile(fileName) {
        await fsPromises.unlink(path.join(__dirname, `./cache/${fileName}`))
    };
    await Promise.all(caches.map(deleteFile));
}

//Create player list
lib.createPlayerList = async function (players) {
    var maxWidth = Math.max.apply(undefined, players.map(getNameWidth));
    var canvas = createCanvas(avatarSize + avatarPadding + maxWidth, players.length * (avatarSize + avatarPadding));
    var ctx = canvas.getContext('2d');

    ctx.font = `${avatarHalf}px Sans`;

    async function drawPngImage(player) {
        var cachePath = path.join(__dirname, `./cache/${player.id}.png`);
        var url;
        if (fs.existsSync(cachePath)) {
            url = cachePath;
        }
        else {
            url = player.url.replace(path.extname(player.url), `.png?size=${avatarSize}`);
            https.get(url, res => {
                res.pipe(fs.createWriteStream(cachePath));
            });
        }
        return await loadImage(url);
    };

    function getNameWidth(player) {
        return testCtx.measureText(player.name).width;
    }

    var images = await Promise.all(players.map(drawPngImage));
    for (var i = 0; i < players.length; i++) {
        ctx.fillStyle = players[i].color;
        ctx.save();
        ctx.beginPath();
        ctx.arc(avatarHalf, (avatarSize + avatarPadding) * i + avatarHalf, avatarHalf, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(images[i], 0, (avatarSize + avatarPadding) * i, avatarSize, avatarSize);
        ctx.restore();
        ctx.fillText(players[i].name, avatarSize + avatarPadding, avatarSize - avatarPadding + (avatarSize + avatarPadding) * i);
    }
    return lib.uriToPng(canvas.toDataURL());
};

//Export the module
module.exports = lib;