//Create images
const textToImage = require('text-to-image');
const { createCanvas, loadImage } = require('canvas');
const fs = require('fs');
const fsPromises = fs.promises;
const { promisify } = require('util');
const sizeOf = promisify(require('image-size'));
const https = require('https');
const path = require('path');
const secrets = require("../secrets")();

//Image module
const lib = {};

const imagePath = "./res/test.png";
const finalImagePath = "./res/output.png";

//Uri to png
lib.uriToPng = function (uri) {
    return new Buffer(uri.split(',')[1], 'base64')
}

//Create player list
lib.createPlayerList = async function (players) {
    async function webpToPng(webpUrl, pngUrl){
        var data = {
            input: "url",
            file: webpUrl,
            outputformat: "png",
            apikey: secrets.convertioKey
        };
        var stringData = JSON.stringify(data);
        var options = {
            hostname: "api.convertio.co",
            path: "/convert",
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Content-Length": stringData.length
            }
        };
        var req = https.request(options, res => {
            console.log(res.statusCode);
            console.log(data, secrets)
            var stringBody = "";
            res.on('data', data => {
                stringBody += data;
            });
            res.on('end', () => {
                var body = JSON.parse(stringBody);
                console.log(body);
                var id = body.data.id;
                https.request(`http://api.convertio.co/convert/${id}/dl`, res => {
                    console.log(res.statusCode);
                    var stringBody = "";
                    res.on('data', data => {
                        stringBody += data;
                    });
                    res.on('end', async () => {
                        var body = JSON.parse(stringBody);
                        await fsPromises.writeFile(pngUrl, lib.uriToPng(body.data.content));
                    });
                });
            });
        });
        req.end(stringData);
    };

    players.forEach(async (player, index) => {
        https.get(player.url, async res => {
            var tempImagePath = path.join(__dirname, "./res/temp" + path.extname(player.url));
            console.log(tempImagePath)
            await res.pipe(fs.createWriteStream(tempImagePath));
            switch (path.extname(player.url)){
                case '.png':
                    break;
                case '.webp':
                    var pngTempImagePath = path.join(__dirname, "./res/temp.png");
                    await webpToPng(tempImagePath, pngTempImagePath);
                    tempImagePath = pngTempImagePath;
                    break
                default:
                    throw new Error("Unknown Extension: ", player.url);
            }
            var canvas = createCanvas(256, 256);
            var ctx = canvas.getContext('2d');
            var image = await loadImage(tempImagePath);
            ctx.drawImage(image, 0, 0, 256, 256);
            await fsPromises.writeFile(path.join(__dirname, `./res/test${index}.png`), lib.uriToPng(canvas.toDataURL()));
        });
    });
}

lib.createPlayerList([
    {
        url: "https://cdn.discordapp.com/embed/avatars/4.png",
        name: "<programmer>Rajas</programmer>"
    },
    {
        url: "https://cdn.discordapp.com/avatars/539505577286434816/bd289c17a1dff59e88df42b73bde2c22.webp",
        name: "Secynt"
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