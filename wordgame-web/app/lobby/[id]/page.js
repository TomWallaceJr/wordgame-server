"use strict";
"use client";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = LobbyPage;
const react_1 = require("react");
const navigation_1 = require("next/navigation");
const socket_1 = require("@/lib/socket");
function LobbyPage() {
    const params = (0, navigation_1.useParams)();
    const searchParams = (0, navigation_1.useSearchParams)();
    const lobbyId = params.id;
    const name = (searchParams.get("name") || "").trim();
    const [players, setPlayers] = (0, react_1.useState)([]);
    const [status, setStatus] = (0, react_1.useState)("waiting");
    const [rounds, setRounds] = (0, react_1.useState)([]);
    const [latestPair, setLatestPair] = (0, react_1.useState)(null);
    const [word, setWord] = (0, react_1.useState)("");
    const [message, setMessage] = (0, react_1.useState)(null);
    const [gameEndedInfo, setGameEndedInfo] = (0, react_1.useState)(null);
    (0, react_1.useEffect)(() => {
        if (!name) {
            setMessage("Add a name on the home page before joining a lobby.");
            return;
        }
        const socket = (0, socket_1.getSocket)();
        socket.emit("join-lobby", { lobbyId, name });
        socket.on("lobby-state", (payload) => {
            setPlayers(payload.players);
            setStatus(payload.status);
            setMessage(payload.players.length < 2
                ? "Waiting for another player..."
                : "Both players are here. Start the game when ready.");
        });
        socket.on("game-started", () => {
            setStatus("in-game");
            setRounds([]);
            setLatestPair(null);
            setGameEndedInfo(null);
            setMessage("Game started! Enter your first word.");
        });
        socket.on("round-updated", (data) => {
            setRounds(data.rounds);
            setLatestPair(data.latestPair);
            setMessage(`Round ${data.roundNumber}. Think of a word related to BOTH.`);
            setWord("");
        });
        socket.on("game-ended", (data) => {
            setStatus("finished");
            setRounds(data.rounds);
            setGameEndedInfo({
                totalRounds: data.totalRounds,
                finalWord: data.finalWord,
            });
            setLatestPair(data.rounds[data.rounds.length - 1] ?? null);
            setMessage("You matched! Game over.");
            setWord("");
        });
        socket.on("waiting-for-opponent", () => {
            setMessage("Waiting for opponent's word...");
        });
        socket.on("error-message", (msg) => {
            setMessage(msg);
        });
        return () => {
            socket.off("lobby-state");
            socket.off("game-started");
            socket.off("round-updated");
            socket.off("game-ended");
            socket.off("waiting-for-opponent");
            socket.off("error-message");
        };
    }, [lobbyId, name]);
    const handleStartGame = () => {
        const socket = (0, socket_1.getSocket)();
        socket.emit("start-game");
    };
    const handleSubmitWord = (e) => {
        e.preventDefault();
        if (!word.trim())
            return;
        const socket = (0, socket_1.getSocket)();
        socket.emit("submit-word", word.trim());
        setMessage("Submitted. Waiting for opponent...");
    };
    const canStart = players.length === 2 && status === "waiting";
    const statusLabel = (0, react_1.useMemo)(() => {
        switch (status) {
            case "waiting":
                return "Waiting";
            case "in-game":
                return "In game";
            case "finished":
                return "Finished";
            default:
                return status;
        }
    }, [status]);
    return (<main className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-4">
      <div className="w-full max-w-4xl space-y-4 rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-xl">
        <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Lobby</p>
            <h1 className="text-2xl font-semibold">#{lobbyId}</h1>
            <p className="text-sm text-slate-400">You are: {name || "Unknown"}</p>
          </div>
          <div className="text-sm text-slate-300">
            Status: <span className="font-semibold">{statusLabel}</span>
          </div>
        </header>

        <section className="flex flex-col gap-4 rounded-xl border border-slate-800 p-4 sm:flex-row">
          <div className="flex-1">
            <h2 className="text-sm font-semibold text-slate-300 mb-2">Players</h2>
            <ul className="space-y-2 text-sm">
              {players.map((p) => (<li key={p.socketId} className="px-3 py-2 rounded-lg bg-slate-800 border border-slate-700">
                  {p.name}
                </li>))}
              {players.length === 0 && (<li className="text-xs text-slate-500">No players yet.</li>)}
            </ul>
          </div>

          <div className="flex-1 flex flex-col items-start justify-center gap-2">
            <button className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed transition" disabled={!canStart} onClick={handleStartGame}>
              Start Game
            </button>
            <p className="text-xs text-slate-400">Both players must be present to start.</p>
          </div>
        </section>

        {message && (<div className="rounded-lg border border-slate-800 bg-slate-800 px-3 py-2 text-sm text-slate-200">
            {message}
          </div>)}

        {status !== "waiting" && (<section className="space-y-3">
            <div className="rounded-xl border border-slate-800 p-3">
              <h2 className="text-sm font-semibold text-slate-300 mb-2">Current words</h2>
              {latestPair ? (<div className="flex flex-col gap-3 sm:flex-row">
                  <div className="flex-1 px-3 py-2 rounded-lg bg-slate-800 text-center border border-slate-700">
                    {latestPair.word1}
                  </div>
                  <div className="flex-1 px-3 py-2 rounded-lg bg-slate-800 text-center border border-slate-700">
                    {latestPair.word2}
                  </div>
                </div>) : (<p className="text-xs text-slate-500">
                  First round: each of you pick any word. The goal is to eventually pick the same word.
                </p>)}
            </div>

            {status !== "finished" && (<form onSubmit={handleSubmitWord} className="flex flex-col gap-2 sm:flex-row">
                <input className="flex-1 rounded-lg bg-slate-800 px-3 py-2 border border-slate-700 text-sm outline-none focus:border-emerald-500 transition" placeholder="Your word" value={word} onChange={(e) => setWord(e.target.value)}/>
                <button type="submit" className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed transition" disabled={!word.trim()}>
                  Submit
                </button>
              </form>)}

            {status === "finished" && gameEndedInfo && (<div className="rounded-xl border border-emerald-500/60 bg-emerald-500/10 p-3 text-sm">
                <p>
                  You matched on <span className="font-semibold">{gameEndedInfo.finalWord}</span>.
                </p>
                <p>Total rounds: {gameEndedInfo.totalRounds}</p>
              </div>)}

            <div className="rounded-xl border border-slate-800 p-3 max-h-48 overflow-auto">
              <h2 className="text-sm font-semibold text-slate-300 mb-2">History</h2>
              {rounds.length === 0 ? (<p className="text-xs text-slate-500">No rounds yet.</p>) : (<ul className="space-y-1 text-xs">
                  {rounds.map((r, idx) => (<li key={idx} className="flex justify-between text-slate-200">
                      <span className="text-slate-400">Round {idx + 1}</span>
                      <span className="font-medium">
                        {r.word1} / {r.word2}
                      </span>
                    </li>))}
                </ul>)}
            </div>
          </section>)}
      </div>
    </main>);
}
//# sourceMappingURL=page.js.map