/**
 * @param {import("Ns").NS } ns
 * @returns {void}
 */
export async function main(ns) {
    const [target, method, time] = ns.args;

    if (time) await ns.sleep(time - Date.now());

    await ns[method](`${target}`);
}

/** @param {import("Ns").NS } ns */
async function staticMemory(ns) {
    await ns.grow('');
}