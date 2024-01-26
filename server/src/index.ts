import express, { Request, Response, NextFunction } from "express";
import http from "http";
import cors from "cors";
import { Player, Room } from "../../Shared-types/types";
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

  const playerData = {
    name: player.name,
    id: player.id,
  };

  set(ref(db, `${player.room.code}/players/${player.id}`), playerData)
    .then(() => {
      console.log("Player saved successfully");
    })
    .catch((error) => {
      console.error("Error saving player: ", error);
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

// Function to generate a player ID
function generatePlayerId() {
  return Math.floor(Math.random() * 1000000);
}

function createNewRoom() {
  const room: Room = {
    code: generateRoomCode(),
    players: [],
    hasGameStarted: false,
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
  };
  return player;
}

function addPlayerToRoom(player: Player, room: Room) {
  console.log(`player ${player.id} is joining room ${room.code}`);
  player.room = room;
  savePlayer(player);
  room.players.push(player);
}

function removePlayerFromRoom(player: Player, room: Room) {
  console.log(`player ${player.id} is leaving room ${room.code}`);
  player.room = null;
  savePlayer(player);
  room.players = room.players.filter((p) => p.id !== player.id);
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

    const room = rooms.find((room) => room.code === req.params.id);
    if (!room) {
      res.status(404).json({ message: "Room not found" });
    } else {
      room.hasGameStarted = req.body.hasGameStarted;
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
