var Class = require(__basedir + "/utilities/class");
var errors = require("../errors");
var serializer = require("../serializer");
var moment = require('moment');

/**
 * @abstract
 * @class BaseGame - the base game plugin new games should inherit from.
 */
var BaseGame = Class({
    init: function(data) {
        // serializable member variables
        this.players = [];
        this.gameObjects = {};
        this.session = (data.session === undefined ? "Unknown" : data.session);

        this._orders = [];
        this._newOrdersToPopIndex = 0;
        this._returnedDataTypeConverter = {};
        this._started = false;
        this._over = false;
        this._nextGameObjectID = 0;
        this._lastSerializableState = null;
        this._currentSerializableState = null;
        this._serializableDeltaState = null;
        this._deltas = []; // record of all delta states, for the game log generation

        this._serializableKeys = {
            "players": true,
            "currentPlayers": true,
            "gameObjects": true,
            "session": true,
            "name": true,
        };
    },

    // The following variable are static, and no game instances should override these, but their class prototypes can
    name: "Base Game", // should be overwritten by the GeneratedGame inheriting this
    numberOfPlayers: 2,
    maxInvalidsPerPlayer: 10,
    _orderFlag: {isOrderFlag: true},



    /////////////////////////////
    // Server starting methods //
    /////////////////////////////

    /**
     * Called then the game starts. Do not inherit this method, instead use begin()
     *
     * @param {Array.<Client>} clients - list of clients that are playing this game, and need a player
     */
    start: function(clients) {
        this._initPlayers(clients);

        var startData = this.begin();

        this._updateSerializableStates("start", startData);
        this._started = true;
    },

    /**
     * Returns a boolean representing if the game has started
     *
     * @returns {boolean} represents if the game has started yet.
     */
    hasStarted: function() {
        return this._started;
    },

    /**
     * Called when the game actually starts and has it's players. Intended to be inherited and extended when the game should be started (e.g. initializing game objects)
     *
     * @inheritable
     * @returns {*} returns any start data you want stored in the game log, such as the random seed (if any procedural generation is used)
     */
    begin: function() {
        // This should be inheritied in <gamename>/game.js. This function is simply here in case they delete the function because they don't need it (no idea why that would be the case though).
    },



    /////////////
    // Players //
    /////////////

    /**
     * Initializes the players based on what clients are connected.
     *
     * @param {Array.<Client>} clients - all client connected to this game, each will have a corresponding player created for it.
     */
    _initPlayers: function(clients) {
        for(var i = 0; i < clients.length; i++) {
            var client = clients[i];
            var player = this.newPlayer({ // this method should be implimented in GeneratedGame
                name: client.name || ("Player " + i),
                clientType: client.type || "Unknown",
            });

            player.invalidMessages = [];
            player.timeRemaining = player.timeRemaining || 1e10; // 10 seconds in nanoseconds
            player.client = client;
            client.setGameData(this, player);
            this.players.push(player);
        }
    },

    /**
     * Called when a client disconnected to remove the client from the game and check if they have a player and if removing them alters the game
     *
     * @param {Player} player - the player whose client disconnected
     * @param {string} reason - human readable resason why this player disconnected
     */
    playerDisconnected: function(player, reason) {
        if(player && this.hasStarted() && !this.isOver()) {
            this.declairLoser(player, reason || "Disconnected during gameplay.");
        }
    },



    //////////////////
    // Game Objects //
    //////////////////

    /**
     * Checks and returns the game object with given id, undefined otherwise.
     *
     * @returns {BaseGameObject} with the given id
     */
    getGameObject: function(id) { // TO INHERIT
        id = parseInt(id);
        if(id !== NaN) {
            return this.gameObjects[id];
        }
    },

    /**
     * Checks if the given object represents a game object in this game instance.
     *
     * @returns {boolean} representing if the passed in obj is a tracked game object in this game
     */
    isGameObject: function(obj) {
        return (serializer.isObject(obj) && obj.id !== undefined && this.getGameObject(obj.id) === obj);
    },

    /**
     * returns the next availible game object id, which by default is the number number as a string. But games where linear id numbers give away info this can be overridden to hide.
     *
     * @returns {string} the next id for a game object. It should never be an id already used this instance, even if that game object is dereferenced everwhere.
     */
    _generateNextGameObjectID: function() {
        return String(this._nextGameObjectID++); // returns this._nextGameObjectID then increments by 1 (that's how post++ works FYI)
    },

    /**
     * Tracks the game object. Should be called via BaseGameObjects during their initialization.
     *
     * @returns {number} thier id
     */
    trackGameObject: function(gameObject) {
        gameObject.id = this._generateNextGameObjectID()
        this.gameObjects[gameObject.id] = gameObject;
        return gameObject.id;
    },



    /////////////////////////////////
    // Client Responses & Requests //
    /////////////////////////////////

    /**
     * Called when a session gets the "finished" event from an ai (client), meaning they finished an order we instructed them to do.
     *
     * @param {Player} the player this ai controls
     * @param {number} orderIndex - the index of the order that finished
     * @param {Object} [data] - serialized data returned from the ai executing that order
     * @returns {Object|undefined} if an error was encountered an invalid object will be returned, undefined if everything went correctly.
     */
    aiFinished: function(player, orderIndex, data) {
        var order = this._orders[orderIndex];
        var invalid = undefined;
        if(order === undefined) {
            invalid = {message: "no order found that you claim to have finished."}
        }
        else {
            var finished = order.name;
            var defaultCallback = this["aiFinished_" + finished];
            var returned = serializer.deserialize(data, this);

            if(this._returnedDataTypeConverter[finished]) { // then we need to "sanatize" what they sent to the type we expected them to return, e.g. C++ returning the string "true" instead of the boolean true.
                returned = this._returnedDataTypeConverter[finished](returned);
            }

            
            var hadCallback = true;
            try {
                if(order.callback) {
                    order.callback(returned);
                }
                else if(defaultCallback) {
                    defaultCallback.call(this, player, returned);
                }
                else {
                    hadCallback = false;
                }
            }
            catch(e) {
                if(Class.isInstance(e, errors.GameLogicError)) {
                    invalid = {finished: finished, returned: returned, message: e.message};
                }
            }

            if(hadCallback) {
                this._updateSerializableStates("finished", {
                    player: serializer.serialize(player, this),
                    order: finished,
                    returned: data,
                });
            }
            else {
                invalid = {finished: finished, message: "No callback for finshed order."}
            }
        }

        return invalid;
    },

    /**
     * Called when a session gets the "run" event from an ai (client), meaning they want the game to run some game logic.
     * 
     * @param {Player} player - the player this ai controls
     * @param {Object} data - serialized data containing what game logic to run.
     * @returns {Promise} A promise that should eventually resolve to whatever the game logic returned from running the 'run' command.
     */
    aiRun: function(player, data) {
        var run = serializer.deserialize(data, this);
        var runCallback = run.caller["_run" + run.functionName.upcaseFirst()];
        var ran = {};

        var kwargs = run.args || {};
        var asyncReturnWrapper = {}; // just an object both asyncReturn and the promise have scope to to pass things to and from.
        var asyncReturn = function(asyncReturnValue) { asyncReturnWrapper.callback(asyncReturnValue); }; // callback function setup below

        var self = this;
        return new Promise(function(resolve, reject) {
            try {
                var ranData = runCallback.call(run.caller, player, kwargs, asyncReturn);

                if(ranData.altersState) {
                    self._updateSerializableStates("run", {
                        player: serializer.serialize(player, self),
                        data: data,
                    });
                }

                if(ranData.returned === BaseGame._orderFlag) { // then they want to execute an order, and are thus returning the value asyncronously
                    asyncReturnWrapper.callback = function(asyncReturnValue) {
                        resolve(asyncReturnValue);
                    };
                }
                else {
                    resolve(ranData.returned);
                }
            }
            catch(e) {
                reject(e);
            }
        });
    },

    /**
     * Called internally by games to order ais (clients) to execute some order.
     *
     * @param {Player} player - the player that we want to execture the order
     * @param {string} orderName - the name of the order to the player's ai to execute
     * @param {Array} [args] - an array that represents the args to send to the order function on the client ai, or [callback] if no args
     * @param {function} [callback] - callback function to execute instead of the normal aiFinished callback
     */
    order: function(player, orderName, args, callback) {
        if(callback === undefined && typeof(args) == "function") {
            callback = args;
        }

        this._orders.push({
            player: player,
            index: this._orders.length,
            name: orderName,
            args: args || [],
            callback: callback,
        });

        return BaseGame._orderFlag;
    },

    /**
     * Called from the session to send this order to the ais (clients). Pops all orders added since the last time this was called
     *
     * @returns {Array.<Object>} array of orders to send
     */
    popOrders: function() {
        var orders = [];
        for(var i = this._newOrdersToPopIndex; i < this._orders.length; i++) {
            orders.push(this._orders[i]);
        }
        this._newOrdersToPopIndex = this._orders.length;
        return orders;
    },



    ///////////////////////////
    // States & Delta States //
    ///////////////////////////

    /**
     * Returns the difference between the last and current state for the given player.
     *
     * @param {Player} player (for inheritance) if the state differs between players inherited games can send different states (such as to hide data from certain players).
     * @returns {Object} the serializable state as the passed in player should see it
     */
    getSerializableDeltaStateFor: function(player) {
        return this._serializableDeltaState;
    },

    /**
     * Updates all the private states used to generate delta states and game logs.
     *
     * @param {string} deltaType - the type of delta that occured (the reason why the state changed)
     * @param {Object} [deltaData] - data about the delta, such as parameters sent that changed it
     */
    _updateSerializableStates: function(deltaType, deltaData) {
        this.hasStateChanged = false;

        var last = this._currentSerializableState || {};
        var current = serializer.serialize(this);
        var delta = serializer.getDelta(last, current);

        if(delta && !serializer.isEmpty(delta)) { // then there is an actual difference between the last and current state
            this.hasStateChanged = true;
            this._lastSerializableState = last;
            this._currentSerializableState = current;
            this._serializableDeltaState = delta;
        }

        this._deltas.push({
            type: deltaType,
            data: deltaData,
            game: delta,
        });
    },

    /**
     * Generates the game log from all the events that happened in this game.
     *
     * @returns {Object} the gamelog to store somewhere and somehow (GameLogger handles that)
     */
    generateGamelog: function(clients) {
        var winners = [];
        var losers = [];

        for(var i = 0; i < clients.length; i++) {
            if(clients[i].player.won) {
                winners.push(i);
            }
            else {
                losers.push(i);
            }
        }

        return {
            gameName: this.name,
            gameSession: this.session,
            deltas: this._deltas,
            epoch: moment().valueOf(),
            winners: winners,
            losers: losers,
        };
    },



    /////////////////////////
    // Winning and Loosing //
    /////////////////////////

    /**
     * Checks if a game is over
     * 
     * @returns {boolean} representing if this game is over
     */
    isOver: function(isOver) {
        if(isOver) {
            this._over = true;
        }

        return this._over;
    },

    /**
     * Throws an IvalidGameLogic error while declairing the player that did that as a loser
     *
     * @param {Player} player that looses because of it's bad logic
     * @param {string} (optional) the human readable message why the logic is invalid
     */
    throwInvalidGameLogic: function(player, message) {
        player.invalidMessages.push(message);

        if(player.invalidMessages.length > this.maxInvalidsPerPlayer) {
            this.declairLoser(player, message);
        }
        
        throw new errors.GameLogicError(message);
    },

    /**
     * Declairs a player as having lost, and assumes when a player looses the rest could still be competing to win.
     *
     * @param {Player} the player that lost the game
     * @param {string} (optional) human readable string that is the lose reason
     * @param {Object} (optional) flags: 'dontCheckForWinner' key to set to not check for winner
     */
    declairLoser: function(loser, reason, flags) {
        loser.lost = true;
        loser.reasonLost = reason || "Lost";
        loser.won = false;
        loser.reasonWon = "";

        if(!flags || !flags.dontCheckForWinner) {
            this.checkForWinner();
        }
    },

    /**
     * Declairs the player as winning, assumes when a player wins the rest lose (unless they've already been set to win)
     *
     * @param {Player} the player that won the game, the rest loose if not already won
     * @param {string} (optional) the human readable string why they won the game
     */
    declairWinner: function(winner, reason) {
        winner.won = true;
        winner.reasonWon = reason || "Won";
        winner.lost = false;
        winner.reasonLost = "";

        for(var i = 0; i < this.players.length; i++) {
            var player = this.players[i];

            if(player !== winner && !player.won && !player.lost) { // then this player has not lost yet and now looses because someone else won
                this.declairLoser(player, "Other player won", {dontCheckForWinner: true});
            }
        }

        this.isOver(true);
    },

    /**
     * Checks if this game is over because there is a winner (all other players have lost).
     *
     * @returns {boolean} boolean represnting if the game is over
     */
    checkForWinner: function() {
        var winner;
        for(var i = 0; i < this.players.length; i++) {
            var player = this.players[i];

            if(!player.lost) {
                if(winner) {
                    return false;
                }
                else {
                    winner = player;
                }
            }
        }

        if(winner) {
            this.declairWinner(winner, "All other players lost.");
            return true;
        }
    },
});

module.exports = BaseGame