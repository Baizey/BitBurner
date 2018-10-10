import {
    getServers,
    cmd
} from 'helper.ns';

let facServers = {
    'avmnite-02h': true,
    'I.I.I.I': true,
    'run4theh111z': true
};

export async function main(ns) {
    let output = 'Network:';
    getServers(ns).forEach(server => {
        let name = server.name;
        let hackColor = ns.hasRootAccess(name) ? 'lime' : 'red';
        let nameColor = facServers[name] ? 'yellow' : 'white';
        output += `<br>${' '.repeat(server.depth)}`;
        output += `<span style='color:${hackColor}'>■ </span>`;
        output += `<a class='scan-analyze-link' style='color:${nameColor}'>${name}</a>`;
        for (let i = 0; i < ns.ls(name, ".cct").length; i++)
            output += "<span style='color:fuchisa'>©</span>"
    });
    ns.tprint(output);
    cmd(ns, 'scan-analyze 0');
}