/**
 * @param {Ns} ns
 * @returns {Promise<void>}
 */
export async function main(ns) {
    await ns.killall(ns.args[0] || ns.getHostname());
}