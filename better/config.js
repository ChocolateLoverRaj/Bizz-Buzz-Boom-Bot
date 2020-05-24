//Config

const defaultConfig = {
    githubLink: "https://github.com/ChocolateLoverRaj/Bizz-Buzz-Boom-Bot",
    channels: {
        bizzBuzzBoom: "703279246562557973"
    },
    bizzBuzzBoom:{
        defaultPreset: {
            2: "bizz",
            3: "buzz",
            5: "boom"
        }
    },
    database: "heroku_w8wxzsb7"
};

const developmentConfig = {
    production: false
}

const productionConfig = {
    production: true,
    domain: "http://bizz-buzz-boom-bot.herokuapp.com/"
};

const currentConfig = Object.assign(defaultConfig, process.env.NODE_ENV == 'production' ? productionConfig : developmentConfig);

module.exports = currentConfig;