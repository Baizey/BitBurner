import {
    getServers,
    cmd,
    display,
    asPercent
} from 'helper.js';

let facServers = {
    'CSEC' : 'yellow',
    'avmnite-02h' : 'yellow',
    'I.I.I.I' : 'yellow',
    'run4theh111z' : 'yellow',
    'The-Cave' : 'orange',
    'w0r1d_d43m0n': 'red'
};

export async function main(ns) {
    let output = 'Network:';
    getServers(ns).forEach(server => {
        let name = server.name;
        let hackColor = ns.hasRootAccess(name) ? 'lime' : 'red';
        let nameColor = facServers[name] ? facServers[name] : 'white';

        let moneyCurr = ns.getServerMoneyAvailable(name);
        let moneyMax = ns.getServerMaxMoney(name);
        let ramMax = ns.getServerRam(name)[0];
        let ramUsed = ns.getServerRam(name)[1];
        let hoverText = [
            `Req level: ${ns.getServerRequiredHackingLevel(name)}`,
            `Req port: ${ns.getServerNumPortsRequired(name)}`,
            `Memory: ${display(ramMax)} GB (${asPercent(ramUsed / ramMax)} used)`,
            `Security: ${ns.getServerSecurityLevel(name)} / ${ns.getServerMinSecurityLevel(name)}`,
            `Money: ${display(moneyCurr)} (${asPercent(moneyCurr / moneyMax)})`,
        ].join('\n');

        output += ['<br>', ' '.repeat(server.depth),
            `<span style='color:${hackColor}'>■ </span>`,
            `<a class='scan-analyze-link' title='${hoverText}'' style='color:${nameColor}'>${name}</a> `,
        ].join('');
    });
    ns.tprint(output);
    cmd(ns, 'scan-analyze 0');
}