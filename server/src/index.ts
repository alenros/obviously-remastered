import express, { Request, Response, NextFunction } from "express";
import http from "http";
import cors from "cors";
import { Player, Room, Word } from "../../Shared-types/types";
import * as utils from "./utils";
import { getDatabase, ref, set } from "firebase/database";
import { initializeApp } from "firebase/app";

const app = express();
app.use(cors());
app.use(express.json());
const server = http.createServer(app);

let rooms: Room[] = [];

let players: Player[] = [];

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

const firebaseApp = initializeApp(firebaseConfig);

app.get("/", (req: Request, res: Response, next: NextFunction) => {
  res.json({ message: "connection made" });
});

app.get("/api/v1/rooms", (req: Request, res: Response, next: NextFunction) => {
  console.log(`Getting all rooms`);
  const roomsAsJson = utils.serializeRooms(rooms);
  res.json({ rooms: roomsAsJson });
});

app.get(
  "/api/v1/rooms/:code",
  (req: Request, res: Response, next: NextFunction) => {
    const room = rooms.find((room) => room.code === req.params.code);
    if (!room) {
      res.status(404).json({ message: "Room not found" });
    }

    const roomAsJson = utils.serializeRoom(room as Room);

    res.json({ room: roomAsJson });
  }
);

function savePlayer(player: Player) {
  console.log(`Saving player ${player.name} to database`);
  const db = getDatabase(firebaseApp);

  if (player.room == null || player.room.code == null) {
    console.log("Player not in room");
    return;
  }

  let playerWords: string = "";
  if (player.words.length > 0) {
    playerWords = player.words
      .filter((word) => word != null)
      .map((word) => word.text)
      .join(",");
  }

  interface PlayerData {
    name: string;
    id: number;
    words?: { words: string };
  }

  let playerData: PlayerData = {
    name: player.name,
    id: player.id,
  };

  if (playerWords.length > 0) {
    playerData.words = {
      words: playerWords,
    };
  }

  set(ref(db, `${player.room.code}/players/${player.id}`), playerData)
    .then(() => {
      console.log("Player saved successfully");
    })
    .catch((error) => {
      console.error("Error saving player: ", error);
    });

  saveUpdateTime(player.room);
}

function saveRoom(room: Room) {
  console.log(`Saving room ${room.code} to database`);
  const db = getDatabase(firebaseApp);

  let sharedWords = "";
  if (room.sharedWords.length > 0) {
    sharedWords = room.sharedWords
      .filter((word) => word != null && word.text != null)
      .map((word) => word.text)
      .toString();
  }
  const roomData = {
    hasGameStarted: room.hasGameStarted,
    sharedWords: sharedWords,
  };

  set(ref(db, `${room.code}/gameState`), roomData)
    .then(() => {
      console.log("Room saved successfully");
    })
    .catch((error) => {
      console.error("Error saving room: ", error);
    });

  saveUpdateTime(room);
}

function saveUpdateTime(room: Room) {
  if (room.code == null) return;

  console.log(`Setting update time for ${room.code}`);
  const db = getDatabase(firebaseApp);

  const currentDate = {
    lastChange: new Date().toLocaleString("en-GB"),
  };

  set(ref(db, `${room.code}/updatetime`), currentDate)
    .then(() => {
      console.log("Room saved successfully");
    })
    .catch((error) => {
      console.error("Error saving room: ", error);
    });
}

function generateRoomCode() {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let result = "";
  for (let i = 0; i < 6; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

function getRandomWords(n: number) {
  const words: Word[] = [
    { text: "cat" },
    { text: "dog" },
    { text: "mouse" },
    { text: "horse" },
    { text: "cow" },
    { text: "sheep" },
    { text: "goat" },
    { text: "pig" },
    { text: "chicken" },
    { text: "duck" },
    { text: "turkey" },
    { text: "rabbit" },
  ];

  let chosenWords: Word[] = utils.shuffle(words, n);

  return chosenWords;
}

// Function to generate a player ID
function generatePlayerId() {
  return Math.floor(Math.random() * 1000000);
}

function createNewRoom() {
  const room: Room = {
    code: generateRoomCode(),
    players: [],
    hasGameStarted: false,
    sharedWords: [],
  };

  console.log(`Creating new room with code: ${room.code}`);

  rooms.push(room);
  return room;
}

function createNewPlayer(name: string) {
  // ensure that the player name is not empty
  if (!name) {
    throw new Error("Player name cannot be empty");
  }
  console.log(`Creating new player with name: ${name}`);

  const player: Player = {
    id: generatePlayerId(),
    name: name,
    room: null,
    words: [],
    chosenWordPair: null,
  };
  return player;
}

function addPlayerToRoom(player: Player, room: Room) {
  console.log(`player ${player.id} is joining room ${room.code}`);
  player.room = room;
  room.players.push(player);
  savePlayer(player);
}

function removePlayerFromRoom(player: Player, room: Room) {
  console.log(`player ${player.id} is leaving room ${room.code}`);
  player.room = null;
  room.players = room.players.filter((p) => p.id !== player.id);
  savePlayer(player);
}

function startGame(room: Room) {
  // Each player gets 2 private words.
  // There are also one shared words for each player, plus one.
  // In total there are 3 * n + 1 words.

  const numberOfPlayers = room.players.length;
  const numberOfWords = numberOfPlayers * 3 + 1;

  const words = getRandomWords(numberOfWords);

  room.sharedWords = words.slice(numberOfPlayers);
  saveRoom(room);
  // Assign words to players
  for (let playerIndex = 0; playerIndex < numberOfPlayers; playerIndex++) {
    const wordIndex = playerIndex * 2;

    const player = room.players[playerIndex];

    player.words = words.slice(wordIndex, wordIndex + 1);

    savePlayer(player);
  }
}

// Player creates and joins room
app.post(
  "/api/v1/rooms/:playerId",
  (req: Request, res: Response, next: NextFunction) => {
    const playerId = parseInt(req.params.playerId);
    console.log(`Creating new room for player: ${playerId} with shortcut`);
    const room = createNewRoom();
    const player = players.find((player) => player.id === playerId);
    if (player) {
      addPlayerToRoom(player, room);
      savePlayer(player);
    }

    const roomAsJson = utils.serializeRoom(room);

    res.json({ room: roomAsJson });
  }
);

// Player joins room
app.post(
  "/api/v1/rooms/:id/players/:playerId",
  (req: Request, res: Response, next: NextFunction) => {
    console.log(
      `Adding player: ${req.params.playerId} to room: ${req.params.id}`
    );

    const room = rooms.find((room) => room.code === req.params.id);
    const playerId = parseInt(req.params.playerId);
    const player = players.find((player) => player.id === playerId);
    if (room && player) {
      addPlayerToRoom(player, room);

      const roomAsJson = utils.serializeRoom(room);

      res.json({ room: roomAsJson });
    } else {
      res.status(404).json({ message: "Room or player not found" });
    }
  }
);

app.put(
  "/api/v1/rooms/:id",
  (req: Request, res: Response, next: NextFunction) => {
    console.log(`Updating room: ${req.params.id}`);

    let room = rooms.find((room) => room.code === req.params.id);

    if (!room) {
      res.status(404).json({ message: "Room not found" });
    } else {
      let newRoomStartStatus = req.body.hasGameStarted;

      // Remove duplicate players from room
      room.players = room.players.filter(
        (player, index, self) =>
          index === self.findIndex((p) => p.id === player.id)
      );

      let hasGameBeenStarted = !room.hasGameStarted && newRoomStartStatus;
      if (hasGameBeenStarted) {
        startGame(room);
      }
      room.hasGameStarted = hasGameBeenStarted;
      saveRoom(room);

      const roomAsJson = utils.serializeRoom(room);

      res.json({ room: roomAsJson });
    }
  }
);

// Player leaves room
app.delete(
  "/api/v1/rooms/:id/players/:playerId",
  (req: Request, res: Response, next: NextFunction) => {
    console.log(
      `Removing player: ${req.params.playerId} from room: ${req.params.id}`
    );

    const room = rooms.find((room) => room.code === req.params.id);
    const playerId = parseInt(req.params.playerId);
    const player = players.find((player) => player.id === playerId);
    if (room && player) {
      removePlayerFromRoom(player, room);
      const roomAsJson = utils.serializeRoom(room);
      res.json({ room: roomAsJson });
    } else {
      res.status(404).json({ message: "Room or player not found" });
    }
  }
);

// Create new player
app.post(
  "/api/v1/players",
  (req: Request, res: Response, next: NextFunction) => {
    try {
      const playerName = req.body.name;
      console.log(`Creating new player: ${playerName}`);
      const player = createNewPlayer(playerName);
      players.push(player);
      console.log(`New player: ${player.id} created with name: ${player.name}`);

      const playerAsJson = utils.serializePlayer(player);
      res.json({ player: playerAsJson });
    } catch (error) {
      res
        .status(400)
        .json({
          message: `Player ${JSON.stringify(
            req.body.name
          )} could not be created`,
        });
    }
  }
);

// List players in room
app.get(
  "/api/v1/rooms/:id/players",
  (req: Request, res: Response, next: NextFunction) => {
    console.log(`Getting players in room: ${req.params.id}`);

    const room = rooms.find((room) => room.code === req.params.id);
    if (room) {
      const playersAsJson = room.players.map(utils.serializePlayer);
      res.json({ players: playersAsJson });
    } else {
      res.status(404).json({ message: "Room not found" });
    }
  }
);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
