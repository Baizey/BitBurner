﻿import {getServers} from "./scan.js";
import {files} from "./updater";

/** @param {import("Ns").NS } ns */
export async function main(ns) {
    const servers = getServers(ns);

    for (let server of servers.map(e => e.name)) {
        await tryCatchIgnore(() => ns.brutessh(server))
        await tryCatchIgnore(() => ns.relaysmtp(server))
        await tryCatchIgnore(() => ns.httpworm(server))
        await tryCatchIgnore(() => ns.ftpcrack(server))
        await tryCatchIgnore(() => ns.sqlinject(server))
        await tryCatchIgnore(() => ns.nuke(server))
    }
    
    for (const server of servers) {
        await ns.scp(files.map(e => `${e}.js`), ns.getHostname(), server.name);
    }
}

/**
 * @param {(() => Promise<void>) | (() => void)} lambda
 * @returns {Promise<void>}
 */
async function tryCatchIgnore(lambda) {
    try {
        await lambda();
    } catch (e) {
        // ignore
    }
}