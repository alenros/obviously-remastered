export interface Room {
    code: string;
    players: Player[];
}

export interface Player {
    id: number;
    name: string;
    room: Room | null;
}