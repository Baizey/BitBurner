import {Runner} from "Runner.js";

export async function main(ns) {
    let runner = new Runner(ns, ns.getHostname());
    await runner.finish('Crack.js');
    await runner.start('stock.js');
    await runner.start('autohack.js');
}