const baseUrl = 'https://raw.githubusercontent.com/Baizey/BitBurner/1.2.0/';

const files = ['scan.js', 'connect.js', 'updater.js'];

/** @param {import("Ns").NS } ns */
export async function main(ns) {
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        ns.rm(file);
        await ns.wget(`${baseUrl}${file}`, file);
        ns.print(`Got ${file} (${i + 1} / ${files.length})`)
    }
    ns.tprint('Done updating!');
}