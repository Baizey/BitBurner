import {getServers} from 'helper.ns';

let cracks = ['brutessh.exe', 'ftpcrack.exe', 'relaysmtp.exe', 'httpworm.exe', 'sqlinject.exe'];

function runCrack(ns, name, target) {
    switch (name) {
        case 'brutessh.exe':
        case 'brutessh':
            ns.brutessh(target);
            break;
        case 'ftpcrack.exe':
        case 'ftpcrack':
            ns.ftpcrack(target);
            break;
        case 'relaysmtp.exe':
        case 'relaysmtp':
            ns.relaysmtp(target);
            break;
        case 'httpworm.exe':
        case 'httpworm':
            ns.httpworm(target);
            break;
        case 'sqlinject.exe':
        case 'sqlinject':
            ns.sqlinject(target);
            break;
    }
}

export async function main(ns) {
    let c = cracks.filter(crack => ns.fileExists(crack));
    let remaining = getServers(ns).map(n => n.name).filter(s => !ns.hasRootAccess(s));
    while (remaining.length > 0) {
        if (c.length < cracks.length) {
            ns.purchaseTor();
            cracks.forEach(crack => ns.purchaseProgram(crack));
            c = cracks.filter(crack => ns.fileExists(crack));
        }
        remaining.filter(s => ns.getServerNumPortsRequired(s) <= c.length)
            .forEach(server => {
                c.forEach(crack => runCrack(ns, crack, server));
                ns.nuke(server);
            });
        remaining = remaining.filter(s => !ns.hasRootAccess(s));
        await ns.sleep(1000);
    }
}