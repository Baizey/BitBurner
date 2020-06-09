import {getFiles} from "helper.js";

export async function main(ns) {
    let files = getFiles().map(f => f.split('/').pop());
    ns.scp(files, ns.getHostname(), ns.args[0]);
}