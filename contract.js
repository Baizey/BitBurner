import {Contract} from 'Contract.js';
import {getServerNames} from "helper.js";

export async function main(ns) {
    ns.disableLog('ALL');
    let servers = getServerNames(ns);
    let failed = {};
    while (true) {
        let contracts = [];
        servers.forEach(server =>
            ns.ls(server.name, ".cct").forEach(name => {
                if (!failed[name])
                    contracts[name].push(new Contract(ns, server.name, name));
            })
        );
        contracts.forEach(contract => contract.answer());
        contracts.filter(c => c.failed).forEach(c => failed[c.filename] = true);
        await ns.sleep(60000);
    }
}