//Create images
//Node.js Modules
const fs = require('fs');
const path = require('path');
const https = require('https');

//Npm Modules
const { createCanvas, loadImage } = require('canvas');
const cloudinary = require('cloudinary').v2;

//My Modules
const secrets = require("./secrets")();
const { avatarSize } = require("./config").bizzBuzzBoom;

const fsPromises = fs.promises;
const avatarPadding = avatarSize / 4;
const avatarHalf = avatarSize / 2;

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
testCtx.font = `${avatarHalf}px Sans`;

cloudinary.config({
    cloud_name: secrets.cloudinaryCloudName,
    api_key: secrets.cloudinaryApiKey,
    api_secret: secrets.cloudinaryApiSecret
});

//Host an image
lib.hostImage = function (image) {
    return new Promise((resolve, reject) => {
        var upload = cloudinary.uploader.upload_stream((err, res) => {
            if (!err && res) {
                resolve(res.secure_url);
            }
            else {
                reject(err);
            }
        });
        upload.end(lib.uriToPng(image));
    });
};

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
    var uri = canvas.toDataURL();
    await fsPromises.writeFile("./res/canvas.png", lib.uriToPng(uri));
    return await lib.hostImage(uri);
};

//Export the module
module.exports = lib;