import {Server} from 'server.js';

let scripts = ['brutessh.exe', 'ftpcrack.exe', 'relaysmtp.exe', 'httpworm.exe', 'sqlinject.exe'];

/**
 * @param {Ns} ns
 * @param {string[]} avail
 * @returns {string[]}
 */
let getAvail = (ns, avail = []) => {
    return avail;
    /*
    if (avail.length === scripts.length) return avail;
    ns.purchaseTor();
    scripts.forEach(s => ns.purchaseProgram(s));
    return scripts.filter(s => ns.fileExists(s));
    */
};

export async function main(ns) {
    let avail = getAvail(ns);
    let servers = Server.get(ns);
    const cracked = servers.filter(e => e.hasRoot && e.type !== Server.types.Own);
    servers = servers.filter(s => !s.hasRoot);
    ns.disableLog('sleep');

    printStuff(ns, cracked, servers);
    while (servers.length > 0) {
        avail = getAvail(ns, avail);
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
    ns.clear();
    ns.print('Cracked:');
    cracked.forEach(e => ns.print(e.name));
    ns.print('');
    ns.print('Not cracked:');
    notCracked.forEach(e => ns.print(e.name));
}