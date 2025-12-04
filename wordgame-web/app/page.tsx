"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function Home() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [lobbyId, setLobbyId] = useState<"lobby-1" | "lobby-2">("lobby-1");

  const handleJoin = () => {
    const clean = name.trim();
    if (!clean) return;
    router.push(`/lobby/${lobbyId}?name=${encodeURIComponent(clean)}`);
  };

  const disabled = !name.trim();

  return (
    <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-4">
      <div className="w-full max-w-xl space-y-6 rounded-2xl bg-slate-900 border border-slate-800 p-8 shadow-xl">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Word Sync</p>
          <h1 className="text-3xl font-semibold mt-2">Find the same word together.</h1>
          <p className="text-slate-300 text-sm mt-2">
            Two lobbies are always available. Grab a friend, join the same lobby, and try to match
            on the same word in as few rounds as possible.
          </p>
        </div>

        <div className="space-y-3">
          <label className="text-sm text-slate-300">Display name</label>
          <input
            className="w-full rounded-lg bg-slate-800 px-3 py-2 border border-slate-700 outline-none focus:border-emerald-500 transition"
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div className="space-y-3">
          <label className="text-sm text-slate-300">Choose a lobby</label>
          <select
            className="w-full rounded-lg bg-slate-800 px-3 py-2 border border-slate-700 outline-none focus:border-emerald-500 transition"
            value={lobbyId}
            onChange={(e) => setLobbyId(e.target.value as "lobby-1" | "lobby-2")}
          >
            <option value="lobby-1">Lobby 1</option>
            <option value="lobby-2">Lobby 2</option>
          </select>
        </div>

        <button
          onClick={handleJoin}
          disabled={disabled}
          className="w-full rounded-lg bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed py-3 font-medium transition"
        >
          Join Lobby
        </button>
        <p className="text-xs text-slate-500">
          Tip: open two tabs and join the same lobby with different names to test quickly.
        </p>
      </div>
    </main>
  );
}
