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
    let servers = Server.get(ns).filter(s => !s.hasRoot);
    while (servers.length > 0) {
        avail = getAvail(ns, avail);
        servers.forEach(s => s.crack(avail));
        servers = servers.filter(s => !s.hasRoot);
        await ns.sleep(1000);
    }
}