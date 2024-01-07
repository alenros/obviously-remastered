<script>
    import { players } from "./store";
</script>

<ul>
  {#if $players.length > 0}
    {#each $players as player (player.id)}
      <li>{player.name}</li>
    {/each}
  {/if}
</ul>