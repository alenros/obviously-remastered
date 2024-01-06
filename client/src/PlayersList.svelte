<script>
    import { players } from "./store";
</script>

<ul>
  {#each $players as player (player.id)}
    <li>{player.name}</li>
  {/each}
</ul>