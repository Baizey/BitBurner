import {getRunner} from "runner";

export async function main(ns){
    let host = ns.getHostname();
    let runner = getRunner(ns, host);

    await runner.start('autocrack.ns');
    await runner.start('autostock.ns');
    await runner.start('autohack.ns');
}