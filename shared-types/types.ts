export interface Room {
    code: string;
    players: Player[];
    hasGameStarted: boolean;
    sharedWords: Word[];
}

export interface Player {
    words: Word[];
    id: number;
    name: string;
    room: Room | null;
    chosenWordPair: [Word, Word] | null;
}

export interface Word {
    text: string;
}