<script>
    export let hasGameStarted = false;
    export let roomId;
    import PlayersList from "./PlayersList.svelte";

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
      })
      .catch((err) => console.log(err));
  }

  async function endGame(){
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