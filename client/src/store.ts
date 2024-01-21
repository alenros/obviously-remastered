import { writable, type Writable } from 'svelte/store';
import type { Player } from '../../Shared-types/types';

function createPlayersStore() {
    const { subscribe, update, set } = writable([]);

    return {
        subscribe,
        set,
        update,
        // TODO: This should actually refresh the list for all connected players
        refreshList: async (roomId: string) => {
            console.log("Updating players list");
            await fetch(`http://localhost:5000/api/v1/rooms/${roomId}/players`)
                .then(async (res) => await res.json())
                .then(data => {
                    console.log(data);
                    update(_ => data.players.map((player: Player) => {
                        return { id: player.id, name: player.name };
                    }))
                })
                .catch((err) => {
                    console.log(err);
                    set([]);
                });
        },
        removePlayer: (playerId: number) => {
            // update(players => {
            //     return players.filter(player => player.id != playerId);
            // });
        }
    };
}

export const players: Writable<Player[]> = createPlayersStore();