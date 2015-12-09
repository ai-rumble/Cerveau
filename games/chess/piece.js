// Generated by Creer at 10:04PM on December 09, 2015 UTC, git hash: '1b69e788060071d644dd7b8745dca107577844e1'

var Class = require(__basedir + "/utilities/class");
var serializer = require(__basedir + "/gameplay/serializer");
var log = require(__basedir + "/gameplay/log");
var GameObject = require("./gameObject");

//<<-- Creer-Merge: requires -->> - Code you add between this comment and the end comment will be preserved between Creer re-runs.

// any additional requires you want can be required here safely between Creer re-runs

//<<-- /Creer-Merge: requires -->>

// @class Piece: A chess piece
var Piece = Class(GameObject, {
    /**
     * Initializes Pieces.
     *
     * @param {Object} data - a simple mapping passsed in to the constructor with whatever you sent with it. GameSettings are in here by key/value as well.
     */
    init: function(data) {
        GameObject.init.apply(this, arguments);

        /**
         * When the piece has been captured (removed from the board) this is true. Otherwise false.
         *
         * @type {boolean}
         */
        this._addProperty("captured", serializer.defaultBoolean(data.captured));

        /**
         * The file (y) coordinate of the checker represented as a number [1-8].
         *
         * @type {number}
         */
        this._addProperty("file", serializer.defaultInteger(data.file));

        /**
         * If the piece has moved from its starting position.
         *
         * @type {boolean}
         */
        this._addProperty("hasMoved", serializer.defaultBoolean(data.hasMoved));

        /**
         * The player that controls this chess Piece.
         *
         * @type {Player}
         */
        this._addProperty("owner", serializer.defaultGameObject(data.owner));

        /**
         * The rank (x) coordinate of the checker represented as a letter [a-h].
         *
         * @type {string}
         */
        this._addProperty("rank", serializer.defaultString(data.rank));

        /**
         * The type of chess piece this is, either: 'King', 'Queen', 'Knight', 'Rook', 'Bishop', or 'Pawn'.
         *
         * @type {string}
         */
        this._addProperty("type", serializer.defaultString(data.type));


        //<<-- Creer-Merge: init -->> - Code you add between this comment and the end comment will be preserved between Creer re-runs.

        // put any initialization logic here. the base variables should be set from 'data' above
        // NOTE: no players are connected (nor created) at this point. For that logic use 'begin()'

        //<<-- /Creer-Merge: init -->>
    },

    gameObjectName: "Piece",


    /**
     * Moves the piece from its current location to the given rank and file.
     *
     * @param {Player} player - the player that called this.
     * @param {string} rank - The rank (x) coordinate to move to. Must be [a-h].
     * @param {number} file - The file (y) coordinate to move to. Must be [1-8].
     * @param {string} promotionType - If this is a Pawn moving to the end of the board then this parameter is what to promote it to.
     * @param {function} asyncReturn - if you nest orders in this function you must return that value via this function in the order's callback.
     * @returns {string} The standard algebraic notation (SAN) representation of the move if successful, empty string otherwise. In addition if you fail your move you lose.
     */
    move: function(player, rank, file, promotionType, asyncReturn) {
        // <<-- Creer-Merge: move -->> - Code you add between this comment and the end comment will be preserved between Creer re-runs.

        var reason;
        if(player !== this.game.currentPlayer) {
            reason = "{player} it is not your turn to make a Move!";
        }

        if(this.captured) {
            reason = "{this} has been captured and cannot Move.";
        }

        rank = rank.toLowerCase()[0];
        var charcode = rank.charCodeAt(0);

        if(charcode < "a".charCodeAt(0) || charcode > "h".charCodeAt(0) || file < 1 || file > 8) {
            reason = "The position {rank}{file} is not within (a1 to h8).";
        }

        // try to find the move
        if(!reason) {
            for(var i = 0; i < this.game.validMoves.length; i++) {
                var move = this.game.validMoves[i];

                var myPos = this.rank + this.file;
                var toPos = rank + file;
                var promotion;
                if(myPos === move.from && toPos == move.to) { // we found the move!
                    if(move.promotion) { // then we have to make sure their promotion is valid
                        var promotion = promotionType.toLowerCase();
                        if(promotion === "knight") {
                            promotion = "n";
                        }

                        var promotion = promotion[0];

                        if(!["n", "b", "r", "q"].contains(promotion)) { // Knight, Bishop, Rook, and Queen are the only valid promotions. These chars are their char representations
                            reason = "'{promotionType}' is not a valid promotion type.";
                            break;
                        }
                    }

                    // everything looks good, let's do it!
                    var result = this.game.chess.move({
                        from: myPos,
                        to: toPos,
                        promotion: promotion,
                    });

                    if(!result) {
                        log.error("Error this was not valid: {} from {} to {}".format(this, myPos, toPos));
                    }
                    else { // valid! update stuff
                        this.game.update(this, result);
                        return result.san;
                    }
                }
            }
        }

        reason = (reason || "{this} can not Move from {this.rank}{this.file} to {rank}{file}").format({
            this: this,
            player: player,
            rank: rank,
            file: file,
            promotionType: promotionType,
        });

        this.game.declareWinner(player.otherPlayer, "Opponent made an invalid move.");
        this.game.declareLoser(player, "Invalid - " + reason);

        return this.game.logicError("", reason);

        // <<-- /Creer-Merge: move -->>
    },

    //<<-- Creer-Merge: added-functions -->> - Code you add between this comment and the end comment will be preserved between Creer re-runs.

    toString: function() {
        return "Piece {owner.color} {type} #{id} at {rank}{file}".format(this);
    }

    //<<-- /Creer-Merge: added-functions -->>

});

module.exports = Piece;
