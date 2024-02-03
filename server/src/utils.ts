import { Player, Room } from "../../Shared-types/types";

export function serializePlayer(player: Player) {
  return {
    id: player.id,
    name: player.name,
    room: player.room ? { code: player.room.code } : null,
    chosenWordPair: player.chosenWordPair
      ? player.chosenWordPair.map((word) => word.text)
      : null,
    words: player.words
      .filter((word) => word != null && word.text !== "")
      .map((word) => word.text),
  };
}

export function serializeRoom(room: Room) {
  return {
    code: room.code,
    players: room.players.map(serializePlayer),
    hasGameStarted: room.hasGameStarted,
    sharedWords: room.sharedWords
                      .filter((word) => word?.text.length > 0)
                      .map((word) => word.text),
  };
}

export function serializeRooms(rooms: Room[]) {
  return rooms.map(serializeRoom);
}

// Durstenfeld shuffle, returning the
export function shuffle(array: any[], n: number) {
  /*
for i from 0 to n−2 do
     j ← random integer such that i ≤ j < n
     exchange a[i] and a[j]

*/
  for (let i = 0; i < n - 2; i++) {
    let j = Math.floor(Math.random() * (i - n + 1)) + i;
    [[array[i]], [array[j]]] = [[array[j]], [array[i]]];
  }
  return array;
}
