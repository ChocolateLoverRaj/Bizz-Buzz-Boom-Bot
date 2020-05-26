declare interface Secrets {
    token: string;
    
    mongodbUsername: string;
    mongodbPassword: string;
    mongodbDomain: string;
}

declare function secrets(): Secrets;

export = secrets;