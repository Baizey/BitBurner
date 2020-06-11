import {Server} from 'util-server.js'

let scripts = ['brutessh.exe', 'ftpcrack.exe', 'relaysmtp.exe', 'httpworm.exe', 'sqlinject.exe'];

/**
 * @param {Ns} ns
 * @returns {string[]}
 */
let getAvail = (ns) => {
    return scripts.filter(e => ns.fileExists(e));
    /*
    if (avail.length === scripts.length) return avail;
    ns.purchaseTor();
    scripts.forEach(s => ns.purchaseProgram(s));
    return scripts.filter(s => ns.fileExists(s));
    */
};

/**
 * @param {Ns} ns
 */
export async function main(ns) {
    let servers = Server.get(ns);
    const cracked = [];
    servers = servers.filter(s => !s.hasRoot);
    ns.disableLog('sleep');

    printStuff(ns, cracked, servers);
    while (servers.length > 0) {
        const avail = getAvail(ns);
        servers.forEach(s => s.crack(avail));

        const hasCrackedMore = servers.filter(e => e.hasRoot).length > 0;
        servers.filter(e => e.hasRoot).forEach(e => cracked.push(e));

        servers = servers.filter(s => !s.hasRoot);
        await ns.sleep(1000);

        if (hasCrackedMore)
            printStuff(ns, cracked, servers);
    }
}

function printStuff(ns, cracked, notCracked) {
    ns.clearLog();
    ns.print('Cracked:');
    cracked.forEach(e => ns.print(e.name));
}