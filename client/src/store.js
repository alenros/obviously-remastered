import { writable } from 'svelte/store';

function createPlayersStore() {
    const { subscribe, set, update } = writable([]);

    return {
        subscribe,
        set,
        // TODO: This should actually refresh the list for all connected players
        refreshList: async (roomId) => {
            console.log("Updating players list");
            await fetch(`http://localhost:5000/api/v1/rooms/${roomId}/players`)
                .then(async (res) => await res.json())
                .then(data => {
                    console.log(data);
                    update(_ => data.players.map(player => {
                        return { id: player.id, name: player.name };
                    }))
                })
                .catch((err) => {
                    console.log(err);
                    set([]);
                });
        },
        removePlayer: (playerId) => {
            update(players => {
                return players.filter(player => player.id !== playerId);
            });
        }
    };
}

export const players = createPlayersStore();