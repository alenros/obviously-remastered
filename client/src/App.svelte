<script>
  import GameLobby from "./GameLobby.svelte";
  import { players } from "./store";

  export let name;
  export let roomId;
  export let hasJoinedRoom = false;
  let hasGameStarted = false;
  async function createRoomAndPlayer() {
    let playerId = await createPlayer();
    let response = await createRoom(playerId);
    console.log(response);
    roomId = response.room.code;
    console.log(`Room id returned: ${roomId}`);
  }

  async function createRoom(playerId) {
    try{
    const response = await fetch(`http://localhost:5000/api/v1/rooms/${playerId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });
    
      const data = await response.json();

      console.log(data);
      return data;
    } catch (err) {
      console.log(`error: ${err}`);
      return;
    }
  }

  async function createPlayer() {
    console.log(`Creating player ${name}`);
    let playerId = null;
    try {
      const response = await fetch(`http://localhost:5000/api/v1/players`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: name }),
      });
      const data = await response.json();
      console.log(data);
      playerId = data.player.id;
    } catch (err) {
      console.log(`error: ${err}`);
    }
    return playerId;
  }

  async function joinRoom() {
    if (name === undefined) {
      console.log("Player Name is undefined");
      return;
    }
    if (roomId === undefined) {
      console.log("Room Id is undefined");
      return;
    }
    let playerId = await createPlayer();
    console.log(`Joining room ${roomId} for player ${playerId}`);
    await fetch(
      `http://localhost:5000/api/v1/rooms/${roomId}/players/${playerId}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      }
    )
      .then(async (res) => await res.json())
      .then((data) => {
        console.log(data);
        // TODO Ensure that the player has joined the room before setting hasJoinedRoom to true
        hasJoinedRoom = true;
      })
      .catch((err) => console.log(err));
    updatePlayersList();
  }

  async function updatePlayersList() {
    console.log(`Updating players list for room ${roomId}`);
    players.refreshList(roomId);
  }
</script>

<main>
  <h1>Hello {name}!</h1>
  <p>
    Name: <input type="text" placeholder="Enter your name" bind:value={name} />
  </p>
  <p>
    <button on:click={() => createRoomAndPlayer()}>Create game</button>
  </p>
  - or -
  <p>
    <input type="text" placeholder="Room code" bind:value={roomId} />
    <button on:click={() => joinRoom()}>Join room</button>
  </p>

  {#if roomId !== undefined && hasJoinedRoom}
    <GameLobby {roomId} {hasGameStarted} />
  {/if}

</main>

<style>
  main {
    text-align: center;
    padding: 1em;
    max-width: 240px;
    margin: 0 auto;
  }

  h1 {
    color: #ff3e00;
    text-transform: uppercase;
    font-size: 4em;
    font-weight: 100;
  }

  @media (min-width: 640px) {
    main {
      max-width: none;
    }
  }
</style>
