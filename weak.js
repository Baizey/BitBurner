/**
 * @param {import("Ns").NS } ns
 * @returns {void}
 */
export async function main(ns) {
    await ns.weaken(`${ns.args[0]}`);
}