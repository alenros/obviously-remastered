import { Player } from "./types";
import { Room } from "./types";
export function serializePlayer(player: Player) {
  return {
    id: player.id,
    name: player.name,
    room: player.room ? { code: player.room.code } : null,
  };
}

export function serializeRoom(room: Room) {
  return {
    code: room.code,
    players: room.players.map(serializePlayer),
  };
}

export function serializeRooms(rooms: Room[]) {
  return rooms.map(serializeRoom);
}
