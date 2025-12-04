"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSocket = void 0;
const socket_io_client_1 = require("socket.io-client");
let socket = null;
const getSocket = () => {
    if (!socket) {
        socket = (0, socket_io_client_1.io)(process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:4000", {
            transports: ["websocket"],
        });
    }
    return socket;
};
exports.getSocket = getSocket;
//# sourceMappingURL=socket.js.map