const baseUrl = 'https://raw.githubusercontent.com/Baizey/BitBurner/1.2.0/';

export const files = [
    'grow', 'weak', 'hack', 'worker', 'constants', // Basic
    'worm', 'buy_server', 'automater', 'scan', 'connect', 'updater', // Utility
    'auto_weaken', // automized tool
    'stupid_hack', 'smart_hack' // Hacking stages
];

/** @param {import("Ns").NS } ns */
export async function main(ns) {
    await update(ns);
    await update(ns);
    ns.tprint('Done updating!');
}

/** @param {import("Ns").NS } ns */
async function update(ns) {
    for (let i = 0; i < files.length; i++) {
        const file = `${files[i]}.js`;
        ns.rm(file);
        await ns.wget(`${baseUrl}${file}`, file);
        ns.print(`Got ${file} (${i + 1} / ${files.length})`)
    }
}