export interface Room {
    code: string;
    players: Player[];
    hasGameStarted: boolean;
}

export interface Player {
    id: number;
    name: string;
    room: Room | null;
}