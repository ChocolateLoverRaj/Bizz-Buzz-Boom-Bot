//Create images
const textToImage = require('text-to-image');
const { createCanvas } = require('canvas');
const fs = require('fs');
const fsPromises = fs.promises;
const {promisify} = require('util');
const sizeOf = promisify(require('image-size'));

const imagePath = "./res/test.png";
async function help() {
    var uri = await textToImage.generate("<programmer>Rajas</programmer>", {
        bgColor: "transparent",
        textColor: "green"
    });
    await fsPromises.writeFile(imagePath, new Buffer(uri.split(',')[1], 'base64'));
    var dimensions = await sizeOf(imagePath);
    console.log(dimensions);
};


help().catch(e => {throw e});

