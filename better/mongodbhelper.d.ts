import Mongodb = require('mongodb');

declare namespace mongodbhelper {
    export function collection(collection: string): Mongodb.Collection;
    export async function init(): void;
}

export = mongodbhelper;