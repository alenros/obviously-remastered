<script lang="ts">
  import type { Player } from "../../Shared-types/types";
  import { players } from "./store";
  import { onMount } from "svelte";
  let playersInRoom: Player[] = [];
  onMount(() => {
    const unsubscribe = players.subscribe((value) => {
      playersInRoom = value;
    });

    return unsubscribe;
  });
</script>

<ul>
  {#if $players?.length > 0}
    {#each $players as player (player?.id)}
      <li>
        {player.name}
        {#if player.words != null && player.words.length > 0}
          {#each player.words as word}
            <p>{word.text}</p>
          {/each}
        {/if}
      </li>
    {/each}
  {/if}
</ul>
