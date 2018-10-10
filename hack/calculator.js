import {getRunner} from 'runner.ns';

let takingConst = 0.5;
let growChange = 0.004;
let hackChange = 0.002;
let weakenChange = 0.05;

async function weaken(ns, minSecurity, runner) {
    let target = runner.target;
    let curr = ns.getServerSecurityLevel(target);
    while (curr > minSecurity) {
        await runner.finish(
            'weaken.script',
            Math.ceil((curr - minSecurity) / weakenChange)
        );
        curr = ns.getServerSecurityLevel(target);
    }
}

export async function main(ns) {

    let args = ns.args[0].split(';');
    let target = args[0];
    let taking = args.length > 1 ? args[1] - 0 : takingConst;

    let self = ns.getHostname();
    let maxMoney = ns.getServerMaxMoney(target);
    let minSecurity = ns.getServerMinSecurityLevel(target);

    let runner = getRunner(ns, self, target);
    // Clean-up on restarts
    await runner.kill(['grow.script', 'weaken.script', 'hack.script']);

    while (!ns.hasRootAccess(target))
        await runner.finish('crack.script', 1, target);

    ns.print(`Got root access`);

    while (ns.getServerRequiredHackingLevel(target) > ns.getHackingLevel())
        await ns.sleep(30000);

    ns.print(`Got hacking level`);

    await weaken(ns, minSecurity, runner);

    ns.print(`Weakened target`);

    if (ns.getServerMoneyAvailable(target) > maxMoney * 0.95)
        await runner.finish('hack.script', 50);
    await weaken(ns, minSecurity, runner);

    ns.print(`Secured not too much money`);

    let growGives = 0;
    while (growGives < 0.000001) {
        let curr = ns.getServerMoneyAvailable(target);
        await runner.finish('grow.script');
        growGives = Math.abs((ns.getServerMoneyAvailable(target) - (curr + 1)) / (curr + 1));
    }

    ns.print(`Grow gives ${growGives}`);

    if (ns.getServerMoneyAvailable(target) < 1000000)
        await runner.finish('grow.script', 10000);
    await weaken(ns, minSecurity, runner);


    let money = ns.getServerMoneyAvailable(target);
    while (ns.getServerMoneyAvailable(target) === money)
        await runner.finish('hack.script');
    let hackTakes = (money - ns.getServerMoneyAvailable(target)) / money;

    ns.print(`Hack takes ${hackTakes}`);

    let moneyLeftAfterHack = maxMoney * (1 - taking);
    let growFrom = (maxMoney - moneyLeftAfterHack) / moneyLeftAfterHack;

    let hackThreads = Math.floor(taking / hackTakes);
    let growThreads = Math.ceil(growFrom / growGives) + 10;
    let threads = {
        hack: hackThreads,
        grow: growThreads,
        weak: Math.ceil((hackChange * hackThreads + growChange * growThreads) / weakenChange)
    };

    ns.print(`Hack: ${threads.hack} Grow: ${threads.grow} Weak: ${threads.weak}`);

    await weaken(ns, minSecurity, runner);
    while (ns.getServerMoneyAvailable(target) < maxMoney) {
        let money = ns.getServerMoneyAvailable(target);
        let need = (maxMoney - money) / money;
        let threads = Math.ceil(need / growGives);
        await runner.finish('grow.script', threads);
        await weaken(ns, minSecurity, runner);
    }

    await runner.start('hack.ns', threads.hack, `${target};${threads.grow};${threads.weak};${taking}`);
}