import { Player, Room } from "../../Shared-types/types";

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
    hasGameStarted: room.hasGameStarted,
  };
}

export function serializeRooms(rooms: Room[]) {
  return rooms.map(serializeRoom);
}