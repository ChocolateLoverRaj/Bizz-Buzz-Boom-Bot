//Config

const defaultConfig = {
    githubLink: "https://github.com/ChocolateLoverRaj/Bizz-Buzz-Boom-Bot"
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