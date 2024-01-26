<script lang="ts">
  import GameLobby from "./GameLobby.svelte";
  import { players } from "./store";
  import { initializeApp } from "firebase/app";
  import { getDatabase, onValue, ref, off } from "firebase/database";
  import type { Player, Room } from "../../shared-types/types";

  export let name: string;
  export let roomId: string;
  export let hasJoinedRoom = false;

  const firebaseConfig = {
    apiKey: "AIzaSyAD5zy3_1xS7sQvHVf00zMht5RNcCUzoYQ",
    authDomain: "obviously-5a958.firebaseapp.com",
    projectId: "obviously-5a958",
    storageBucket: "obviously-5a958.appspot.com",
    messagingSenderId: "738128384006",
    appId: "1:738128384006:web:6a99f01b6dd55eb942b387",
    databaseURL:
      "https://obviously-5a958-default-rtdb.europe-west1.firebasedatabase.app",
  };

  const app = initializeApp(firebaseConfig);
  const database = getDatabase(app);

  let playersRef = ref(database, `${roomId}/players/`);

  let hasGameStarted = false;

  function subscribeToPlayers() {
    playersRef = ref(database, `${roomId}/players/`);

    onValue(playersRef, (snapshot) => {
      const data = snapshot.val();

      if (data === null) {
        console.log("player data is null");
        return;
      }

      const newPlayers : Player[] = Object.values(data);

      players.set(newPlayers);
    });
  }

  async function createRoomAndPlayer() {
    let playerId = await createPlayer();
    let response = await createRoom(playerId);
    console.log(response);
    roomId = response.room.code;
    let player: Player = { id: playerId, name: name, room: response.room};
    joinSpecificRoom(response.room, player);
    subscribeToPlayers();

    console.log(`Room id returned: ${roomId}`);
  }

  async function joinSpecificRoom(room: Room, player: Player) {
    if (player.name === undefined) {
      console.log("Player Name is undefined");
      return;
    }
    if (room.code === undefined) {
      console.log("Room Id is undefined");
      return;
    }
    let playerId = await createPlayer();
    console.log(`Joining room ${room.code} for player ${player.id}`);
    await fetch(
      `http://localhost:5000/api/v1/rooms/${room.code}/players/${player.id}`,
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
  }

  async function createRoom(playerId: number) {
    try {
      const response = await fetch(
        `http://localhost:5000/api/v1/rooms/${playerId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

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

    subscribeToPlayers();

    // updatePlayersList();
  }

  async function leaveRoom() {
    if (name === undefined) {
      console.log("Player Name is undefined");
      return;
    }
    if (roomId === undefined) {
      console.log("Room Id is undefined");
      return;
    }

    let playerId = await createPlayer();
    console.log(`Leaving room ${roomId} for player ${playerId}`);
    await fetch(
      `http://localhost:5000/api/v1/rooms/${roomId}/players/${playerId}`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      }
    )
      .then(async (res) => await res.json())
      .then((data) => {
        console.log(data);
        // TODO Ensure that the player has left the room before setting hasJoinedRoom
        hasJoinedRoom = false;
      })
      .catch((err) => console.log(err));

    // playersRef = ref(database, `${roomId}/players/`);
    console.log("Unsubscribed from players");
    off(playersRef);
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
