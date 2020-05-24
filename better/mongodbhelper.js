//Connect to mongodb

//Dependancies
//Npm Modules
const mongodb = require('mongodb');

//My Modules
const secrets = require("./secrets")();
const config = require("./config");

//Container for module
const mongodbhelper = {};

//Uri to connect to mongodb
const uri = 'mongodb://' + secrets.mongodbUsername + ':' + secrets.mongodbPassword + "@" + secrets.mongodbDomain;
const mongoClient = new mongodb.MongoClient(uri, { useUnifiedTopology: true, useNewUrlParser: true });

//Quickly get a collection
mongodbhelper.collection = function (collection) {
    if (mongoClient.isConnected()) {
        return mongoClient.db(config.database).collection(collection);
    }
    else {
        throw new ReferenceError("Not yet connected to mongodb.");
    }
};

//Init function
mongodbhelper.init = async function () {
    mongoClient.connect()
        .then(client => {
            return undefined;
        })
        .catch(err => {
            throw err;
        })
}

//Export the module
module.exports = mongodbhelper;