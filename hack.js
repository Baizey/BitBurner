/**
 * @param {import("Ns").NS } ns
 * @returns {void}
 */
export async function main(ns) {
    await ns.hack(`${ns.args[0]}`);
}