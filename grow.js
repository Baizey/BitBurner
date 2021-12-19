/**
 * @param {import("Ns").NS } ns
 * @returns {void}
 */
export async function main(ns) {
    await ns.grow(`${ns.args[0]}`);
}