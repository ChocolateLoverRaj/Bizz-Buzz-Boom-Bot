//Create images
const { createCanvas, loadImage } = require('canvas');
const fs = require('fs');
const fsPromises = fs.promises;
const path = require('path');
const https = require('https');
const secrets = require('./secrets')();
const cloudinary = require('cloudinary').v2;

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
    var canvas = createCanvas(64 + 16 + maxWidth, players.length * (64 + 16));
    var ctx = canvas.getContext('2d');

    ctx.font = "32px Sans";

    async function drawPngImage(player) {
        var cachePath = path.join(__dirname, `./cache/${player.id}.png`);
        var url;
        if (fs.existsSync(cachePath)) {
            url = cachePath;
        }
        else {
            url = player.url.replace(path.extname(player.url), ".png?size=64");
            https.get(url, res => {
                res.pipe(fs.createWriteStream(cachePath));
            });
        }
        console.log(url);
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
        ctx.arc(32, (64 + 16) * i + 32, 32, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(images[i], 0, (64 + 16) * i, 64, 64);
        ctx.restore();
        ctx.fillText(players[i].name, 64 + 16, 48 + (64 + 16) * i);
    }
    var uri = canvas.toDataURL();
    await fsPromises.writeFile("./res/canvas.png", lib.uriToPng(uri));
    return await lib.hostImage(uri);
};

//Export the module
module.exports = lib;