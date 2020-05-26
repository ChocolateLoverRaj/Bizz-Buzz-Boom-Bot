declare interface Secrets {
    token: string;
    
    mongodbUsername: string;
    mongodbPassword: string;
    mongodbDomain: string;

    cloudinaryCloudName: string;
    cloudinaryApiSecret: string;
    cloudinaryApiKey: string;
}

declare function secrets(): Secrets;

export = secrets;