import {getFiles} from "helper.js";

let baseUrl = 'https://raw.githubusercontent.com/Baizey/BitBurner/master/';
let url = path => `${baseUrl}${path}`;

async function get(ns, path) {
    return await ns.wget(url(path), path.split('/').pop());
}

export async function main(ns) {
    let files = getFiles();
    for (let i in files)
        await get(ns, files[i]);
    ns.tprint('<span style="color:white">Done updating!</span>');
}