<script lang="ts">
  import type { Word } from "../../Shared-types/types";
  export let hasGameStarted = false;
  export let roomId: string;
  import PlayersList from "./PlayersList.svelte";
  export let shardWords: Word[] = [];

  async function startGame() {
    console.log(`Starting game for room ${roomId}`);
    await fetch(`http://localhost:5000/api/v1/rooms/${roomId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ hasGameStarted: true }),
    })
      .then(async (res) => await res.json())
      .then((data) => {
        console.log(data);
        hasGameStarted = true;
        data.room.sharedWords.forEach((word: string) => {
          shardWords = [...shardWords, { text: word }];
        });
      })
      .catch((err) => console.log(err));
  }

  async function endGame() {
    console.log(`Ending game for room ${roomId}`);
    await fetch(`http://localhost:5000/api/v1/rooms/${roomId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ hasGameStarted: false }),
    })
      .then(async (res) => await res.json())
      .then((data) => {
        console.log(data);
        hasGameStarted = false;
      })
      .catch((err) => console.log(err));
  }
</script>

<p>Room Code: {roomId}</p>

{#if hasGameStarted === false}
  <div><button on:click={() => startGame()}>Start Game</button></div>
{:else}
  <div><button on:click={() => endGame()}>End Game</button></div>
{/if}
<p>Players:</p>
<PlayersList />
{#if hasGameStarted === true}
  <p>Common words:</p>
  <ul>
    {#each shardWords as word}
      <li>{word.text}</li>
    {/each}
  </ul>
{/if}
