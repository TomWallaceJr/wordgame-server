import cors from "cors";
import express from "express";
import http from "http";
import { Server } from "socket.io";

type Player = {
  socketId: string;
  name: string;
};

type LobbyStatus = "waiting" | "in-game" | "finished";

type Lobby = {
  id: string;
  players: Player[];
  status: LobbyStatus;
  rounds: { word1: string; word2: string }[];
  currentWords: Record<string, string>;
};

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" },
});

const lobbies: Record<string, Lobby> = {
  "lobby-1": { id: "lobby-1", players: [], status: "waiting", rounds: [], currentWords: {} },
  "lobby-2": { id: "lobby-2", players: [], status: "waiting", rounds: [], currentWords: {} },
};

const normalizeWord = (word: string) => word.trim().toLowerCase();

const levenshteinDistance = (a: string, b: string): number => {
  if (a === b) return 0;
  if (!a) return b.length;
  if (!b) return a.length;

  const dp: number[] = Array.from({ length: b.length + 1 }, (_, j) => j);

  for (let i = 1; i <= a.length; i++) {
    let prev = i;
    dp[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const temp = dp[j] ?? Number.MAX_SAFE_INTEGER;
      const left = dp[j - 1] ?? Number.MAX_SAFE_INTEGER;
      if (a[i - 1] === b[j - 1]) {
        dp[j] = prev;
      } else {
        dp[j] = Math.min(prev, temp, left) + 1;
      }
      prev = temp;
    }
  }

  return dp[b.length] ?? Number.MAX_SAFE_INTEGER;
};

const wordsMatch = (a: string, b: string): boolean => {
  const w1 = normalizeWord(a);
  const w2 = normalizeWord(b);
  if (w1 === w2) return true;
  // Allow a single-character typo to still count as a match.
  return levenshteinDistance(w1, w2) <= 1;
};

const getLobbyForSocket = (socketId: string): Lobby | undefined =>
  Object.values(lobbies).find((lobby) => lobby.players.some((p) => p.socketId === socketId));

const broadcastLobbyState = (lobby: Lobby) => {
  io.to(lobby.id).emit("lobby-state", {
    id: lobby.id,
    players: lobby.players,
    status: lobby.status,
  });
};

io.on("connection", (socket) => {
  console.log("connected:", socket.id);

  socket.on("join-lobby", ({ lobbyId, name }: { lobbyId: string; name: string }) => {
    const lobby = lobbies[lobbyId];
    if (!lobby) {
      socket.emit("error-message", "Lobby does not exist.");
      return;
    }
    if (lobby.players.length >= 2) {
      socket.emit("error-message", "Lobby full.");
      return;
    }

    lobby.players.push({ socketId: socket.id, name: name.trim() || "Player" });
    socket.join(lobbyId);
    broadcastLobbyState(lobby);
  });

  socket.on("start-game", () => {
    const lobby = getLobbyForSocket(socket.id);
    if (!lobby) return;
    if (lobby.players.length < 2) {
      socket.emit("error-message", "Need two players to start.");
      return;
    }

    lobby.status = "in-game";
    lobby.rounds = [];
    lobby.currentWords = {};

    io.to(lobby.id).emit("game-started", { lobbyId: lobby.id });
  });

  socket.on("submit-word", (word: string) => {
    const lobby = getLobbyForSocket(socket.id);
    if (!lobby || lobby.status !== "in-game") return;

    const clean = word.trim();
    if (!clean) {
      socket.emit("error-message", "Word cannot be empty.");
      return;
    }

    lobby.currentWords[socket.id] = clean;

    if (Object.keys(lobby.currentWords).length < 2) {
      socket.emit("waiting-for-opponent");
      return;
    }

    const [p1, p2] = lobby.players;
    if (!p1 || !p2) {
      socket.emit("error-message", "Opponent left the game.");
      return;
    }

    const w1 = lobby.currentWords[p1.socketId];
    const w2 = lobby.currentWords[p2.socketId];

    if (!w1 || !w2) return;

    lobby.rounds.push({ word1: w1, word2: w2 });
    lobby.currentWords = {};

    const same = wordsMatch(w1, w2);

    if (same) {
      lobby.status = "finished";
      io.to(lobby.id).emit("game-ended", {
        rounds: lobby.rounds,
        totalRounds: lobby.rounds.length,
        finalWord: w1,
      });
    } else {
      io.to(lobby.id).emit("round-updated", {
        latestPair: { word1: w1, word2: w2 },
        rounds: lobby.rounds,
        roundNumber: lobby.rounds.length,
      });
    }
  });

  socket.on("restart-game", () => {
    const lobby = getLobbyForSocket(socket.id);
    if (!lobby) return;

    lobby.status = "waiting";
    lobby.rounds = [];
    lobby.currentWords = {};

    broadcastLobbyState(lobby);
    io.to(lobby.id).emit("game-restarted");
  });

  socket.on("disconnect", () => {
    const lobby = getLobbyForSocket(socket.id);
    if (!lobby) return;

    lobby.players = lobby.players.filter((p) => p.socketId !== socket.id);
    lobby.currentWords = {};
    lobby.status = "waiting";
    lobby.rounds = [];

    broadcastLobbyState(lobby);
    console.log("disconnected:", socket.id);
  });
});

app.get("/", (_req, res) => {
  res.send("OK");
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
