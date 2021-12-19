const baseUrl = 'https://raw.githubusercontent.com/Baizey/BitBurner/1.2.0/';

/** @param {import("Ns").NS } ns */
export async function main(ns) {
    let files = ['scan.js'];
    for (let i in files) await ns.wget(`${baseUrl}${files[i]}`, files[i]);
    await ns.wget(`${baseUrl}updater.js`, 'updater.js');
    ns.tprint('Done updating!');
}