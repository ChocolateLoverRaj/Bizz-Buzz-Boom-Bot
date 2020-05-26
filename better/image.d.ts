declare namespace image{
    export interface Player{
        name: string;
        id: string;
        url: string;
        color: string;
    }

    export function init(): Promise<undefined>;

    export function uriToPng(uri: string): Buffer;

    export function createPlayerList(players: Array<Player>): Promise<string>;
}

export = image;