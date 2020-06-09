import {Server} from 'server.js'

/**
 * @param {Ns} ns
 * @returns {Promise<void>}
 */
export async function main(ns) {
    const target = ns.args[0];
    const allServers = Server.get(ns);

    while (true) {
        for (let server of allServers) {
            if (!server.hasRoot || server.name === 'home') continue;
            const used = ns.getScriptRam('hack.script')
            const threads = Math.floor(server.freeRam / used);
            if (threads < 1) continue;
            await ns.exec('hack.script', server.name, threads, target)
        }
        await ns.sleep(10000);
    }
}