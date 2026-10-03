class MultiplayerManager {
    constructor() {
        this.playerId = uuidv4();
        this.playerName = 'Player_' + this.playerId.substring(0, 8);
        this.server = null;
        this.isHost = false;
        this.connectedPlayers = new Map();
        this.messageHandlers = new Map();
        this.setupMessageHandlers();
    }

    setupMessageHandlers() {
        this.messageHandlers.set('playerJoined', (data) => this.handlePlayerJoined(data));
        this.messageHandlers.set('playerLeft', (data) => this.handlePlayerLeft(data));
        this.messageHandlers.set('blockPlaced', (data) => this.handleBlockPlaced(data));
        this.messageHandlers.set('blockBroken', (data) => this.handleBlockBroken(data));
        this.messageHandlers.set('playerMoved', (data) => this.handlePlayerMoved(data));
    }

    hostServer() {
        this.isHost = true;
        this.server = new SimpleGameServer(this.playerId, this.playerName);
        this.connectedPlayers.set(this.playerId, {
            id: this.playerId,
            name: this.playerName,
            position: { x: 0, y: 0, z: 0 }
        });
        return {
            serverCode: this.server.getServerCode(),
            message: `Server hosted by ${this.playerName}`
        };
    }

    joinServer(serverCode, playerName) {
        this.playerName = playerName || this.playerName;
        // Simulated server connection
        this.connectedPlayers.set(this.playerId, {
            id: this.playerId,
            name: this.playerName,
            position: { x: 0, y: 0, z: 0 }
        });
        return {
            success: true,
            message: `Connected to server as ${this.playerName}`
        };
    }

    broadcastBlockPlaced(position, blockType) {
        const message = {
            type: 'blockPlaced',
            playerId: this.playerId,
            position,
            blockType,
            timestamp: Date.now()
        };
        this.broadcast(message);
    }

    broadcastBlockBroken(position) {
        const message = {
            type: 'blockBroken',
            playerId: this.playerId,
            position,
            timestamp: Date.now()
        };
        this.broadcast(message);
    }

    broadcastPlayerMove(position) {
        const message = {
            type: 'playerMoved',
            playerId: this.playerId,
            position,
            timestamp: Date.now()
        };
        this.broadcast(message);
    }

    broadcast(message) {
        // Simulated broadcast - in real implementation would send over WebSocket/network
        this.handleMessage(message);
    }

    handleMessage(message) {
        const handler = this.messageHandlers.get(message.type);
        if (handler) handler(message);
    }

    handlePlayerJoined(data) {
        this.connectedPlayers.set(data.playerId, {
            id: data.playerId,
            name: data.playerName,
            position: data.position
        });
    }

    handlePlayerLeft(data) {
        this.connectedPlayers.delete(data.playerId);
    }

    handleBlockPlaced(data) {
        if (data.playerId !== this.playerId) {
            // Update world for other players' block placements
        }
    }

    handleBlockBroken(data) {
        if (data.playerId !== this.playerId) {
            // Update world for other players' block breaking
        }
    }

    handlePlayerMoved(data) {
        if (this.connectedPlayers.has(data.playerId)) {
            this.connectedPlayers.get(data.playerId).position = data.position;
        }
    }

    getConnectedPlayers() {
        return Array.from(this.connectedPlayers.values());
    }
}

class SimpleGameServer {
    constructor(hostId, hostName) {
        this.hostId = hostId;
        this.hostName = hostName;
        this.serverCode = this.generateServerCode();
        this.players = new Map();
        this.worldData = new Map();
        this.players.set(hostId, { id: hostId, name: hostName });
    }

    generateServerCode() {
        return 'SRV-' + Math.random().toString(36).substring(2, 10).toUpperCase();
    }

    getServerCode() {
        return this.serverCode;
    }

    addPlayer(playerId, playerName) {
        this.players.set(playerId, { id: playerId, name: playerName });
    }

    removePlayer(playerId) {
        this.players.delete(playerId);
    }

    broadcastWorldUpdate(update) {
        // Broadcast to all connected players
    }

    getWorldData() {
        return Object.fromEntries(this.worldData);
    }
}
