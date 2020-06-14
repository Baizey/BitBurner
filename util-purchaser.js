import {asFormat} from "util-utils.js";

/**
 * @param {Ns} ns
 * @returns {Promise<void>}
 */
export async function main(ns) {
    if (ns.args[0] === 'delete')
        if (ns.args[1] === 'all')
            ns.getPurchasedServers().forEach(s => ns.deleteServer(s))
        else if (ns.args[1])
            ns.deleteServer(ns.args[1])
        else
            ns.tprint(`<span style="color:grey">Delete needs arg for hostname or 'all' to delete all</span>`);
    else if (ns.args[0] === 'buy') {
        if (ns.args[1] && ns.args[1] > 0) {
            ns.purchaseServer(ns.args[2] || 's', Math.min(ns.getPurchasedServerMaxRam(), Math.pow(2, ns.args[1] - 0)));
        } else {
            const money = ns.getServerMoneyAvailable('home')
            let result = 1;
            while (Math.pow(2, result) * 55000 < money && result <= 20)
                result++;
            result--;
            ns.tprint(`<span style="color:grey">Highest amount to buy with ${Math.pow(2, result)} (2^${result}) GB arm and $${asFormat(55000 * Math.pow(2, result))}</span>`);
        }
    } else
        ns.tprint(`<span style="color:grey">First arg needs to be buy or delete</span>`);
}