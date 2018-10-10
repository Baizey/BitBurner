import {
    getServers,
    getCracks
} from 'helper.ns';

export async function main(ns) {
    let cracks = getCracks();
    let self = ns.getHostname();
    let has = cracks.filter(crack => ns.fileExists(crack, self)).length;
    ns.print(`Has ${has} out of ${cracks.length} programs`);
    let servers = getServers(ns).map(s => s.name);
    for (let i in servers) {
        let server = servers[i];
        if (ns.hasRootAccess(server))
            return;
        if (ns.getServerNumPortsRequired(server) > has)
            return;
        await ns.start('crack.script', 1, server);
    }
}