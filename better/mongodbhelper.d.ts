import Mongodb = require('mongodb');

declare namespace mongodbhelper {
    export function collection(collection: string): Mongodb.Collection;
    export function init(): Promise<undefined>;
}

export = mongodbhelper;