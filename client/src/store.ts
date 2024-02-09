import { writable, type Writable } from 'svelte/store';
import type { Player } from '../../Shared-types/types';

function createPlayersStore() {
    const { subscribe, update, set } = writable([]);

    return {
        subscribe,
        set,
        update
    };
}

export const players: Writable<Player[]> = createPlayersStore();