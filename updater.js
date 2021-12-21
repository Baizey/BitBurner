import {files} from "./constants.js";

const baseUrl = 'https://raw.githubusercontent.com/Baizey/BitBurner/1.2.0/';

/** @param {import("Ns").NS } ns */
export async function main(ns) {
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