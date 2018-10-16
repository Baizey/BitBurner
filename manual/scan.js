import {
    getServers,
    cmd,
    display
} from 'helper.js';

let facServers = {
    'CSEC' : 'yellow',
    'avmnite-02h' : 'yellow',
    'I.I.I.I' : 'yellow',
    'run4theh111z' : 'yellow',
    'The-Cave' : 'orange'
};


export async function main(ns) {
    let output = 'Network:';
    getServers(ns).forEach(server => {
        let name = server.name;
        let hackColor = ns.hasRootAccess(name) ? 'lime' : 'red';
        let nameColor = facServers[name] ? facServers[name] : 'white';

        let hoverText = [
            'Req Level: ', ns.getServerRequiredHackingLevel(name),
            '&#10;Req Ports: ', ns.getServerNumPortsRequired(name),
            '&#10;Memory: ', ns.getServerRam(name)[0], 'GB',
            '&#10;Security: ', ns.getServerSecurityLevel(name),
            '/', ns.getServerMinSecurityLevel(name),
            '&#10;Money: ', display(ns.getServerMoneyAvailable(name)), ' (',
            Math.round(100 * ns.getServerMoneyAvailable(name)/ns.getServerMaxMoney(name)), '%)'
        ].join('');

        output += ['<br>', ' '.repeat(server.depth),
            `<span style='color:${hackColor}'>■ </span>`,
            `<a class='scan-analyze-link' title='${hoverText}'' style='color:${nameColor}'>${name}</a> `,
        ].join('');
    });
    ns.tprint(output);
    cmd(ns, 'scan-analyze 0');
}