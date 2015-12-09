// Generated by Creer at 10:04PM on December 09, 2015 UTC, git hash: '1b69e788060071d644dd7b8745dca107577844e1'
// Note: You should never modify this file... probably.

var GameManager = require(__basedir + "/gameplay/shared/gameManager");
var serializer = require(__basedir + "/gameplay/serializer");

/**
 * An instance of the base GameManager class, given the structure of this Chess game so it can manage the game safely.
 */
var chessGameManager = new GameManager({
    Game: {
        name: "Chess",
    },

    AI: {
        runTurn: {
            args: [
            ],
            returns: {
                converter: serializer.defaultBoolean,
                defaultValue: true,
            },
        },

        //<<-- Creer-Merge: secret-AI -->> - Code you add between this comment and the end comment will be preserved between Creer re-runs.

        // if you want to add a "secret" method that clients don't publicly know about, but can call, do so here. Best use case is an easy way for human clients to ask for special game information, otherwise forget this exists.

        //<<-- /Creer-Merge: secret-AI -->>

    },

    GameObject: {
        log: {
            args: [
                {
                    name: "message",
                    converter: serializer.defaultString,
                },
            ],
            returns: undefined,
        },

        //<<-- Creer-Merge: secret-GameObject -->> - Code you add between this comment and the end comment will be preserved between Creer re-runs.

        // if you want to add a "secret" method that clients don't publicly know about, but can call, do so here. Best use case is an easy way for human clients to ask for special game information, otherwise forget this exists.

        //<<-- /Creer-Merge: secret-GameObject -->>

    },

    Piece: {
        move: {
            args: [
                {
                    name: "rank",
                    converter: serializer.defaultString,
                },
                {
                    name: "file",
                    converter: serializer.defaultInteger,
                },
                {
                    name: "promotionType",
                    converter: serializer.defaultString,
                    defaultValue: "",
                },
            ],
            returns: {
                converter: serializer.defaultString,
                defaultValue: "",
            },
        },

        //<<-- Creer-Merge: secret-Piece -->> - Code you add between this comment and the end comment will be preserved between Creer re-runs.

        // if you want to add a "secret" method that clients don't publicly know about, but can call, do so here. Best use case is an easy way for human clients to ask for special game information, otherwise forget this exists.

        //<<-- /Creer-Merge: secret-Piece -->>

    },

    Player: {

        //<<-- Creer-Merge: secret-Player -->> - Code you add between this comment and the end comment will be preserved between Creer re-runs.

        getMoves: {
            args: [],
            returns: {
                converter: serializer.defaultArray,
                defaultValue: {},
            },
            isSecret: true,
        },

        //<<-- /Creer-Merge: secret-Player -->>

    },
});

module.exports = chessGameManager;
