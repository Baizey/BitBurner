import {getRunner} from "runner";

export async function main(ns) {
    let runner = getRunner(ns, ns.getHostname());
    await runner.finish('crack.ns');
    await runner.start('stock.ns');
    await runner.start('autohack.ns');
}