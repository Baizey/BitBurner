import {Runner} from "Runner.js";
import {getArgs} from "helper";

export async function main(ns) {
    let self = ns.getHostname();
    let args = getArgs(ns);
    let target = args[0];
    let growThreads = args[1] - 0;
    let weakThreads = args[2] - 0;
    let taking = args[3];

    let runner = new Runner(ns, self, target);

    // Clean-up on restarts
    await runner.await(['grow.script', 'weaken.script']);

    while(ns.getServerMoneyAvailable(target) >= ns.getServerMaxMoney(target)) {
        await runner.start('weaken.script', weakThreads);
        await runner.start('grow.script', growThreads);
        await ns.hack(target);
        await runner.await('weaken.script');
        await runner.await('grow.script');
    }

    await runner.start('calculator.js', 1, `${target};${taking}`);
}