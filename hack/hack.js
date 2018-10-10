import {getRunner} from "runner.ns";

export async function main(ns) {
    let self = ns.getHostname();
    let args = ns.args[0].split(';');
    let target = args[0];
    let growThreads = args[1] - 0;
    let weakThreads = args[2] - 0;
    let taking = args[3];

    let runner = getRunner(ns, self, target);

    // Clean-up on restarts
    await runner.await(['grow.script', 'weaken.script']);

    while(ns.getServerMoneyAvailable(target) >= ns.getServerMaxMoney(target)) {
        await runner.start('weaken.script', weakThreads);
        await runner.start('grow.script', growThreads);
        await ns.hack(target);
        await runner.await('weaken.script');
        await runner.await('grow.script');
    }

    await runner.start('calculator.ns', 1, `${target};${taking}`);
}