import {Runner} from 'Runner.js';
import {asPercent} from "helper.js";

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
    ns.print('Weakened server...');
}

export async function main(ns) {
    ns.disableLog('ALL');

    let args = ns.args[0].split(';');
    let target = args[0];
    let taking = args.length > 1 ? args[1] - 0 : takingConst;

    let self = ns.getHostname();
    let maxMoney = ns.getServerMaxMoney(target);
    let minSecurity = ns.getServerMinSecurityLevel(target);

    let runner = new Runner(ns, self, target);
    // Clean-up on restarts
    await runner.kill(['grow.script', 'weaken.script', 'hack.script']);

    ns.print('Starting...');

    while (!ns.hasRootAccess(target))
        await ns.sleep(30000);
    ns.print(`got root access...`);

    while (ns.getServerRequiredHackingLevel(target) > ns.getHackingLevel())
        await ns.sleep(30000);
    ns.print(`got hacking level...`);

    await weaken(ns, minSecurity, runner);

    while (ns.getServerMoneyAvailable(target) > maxMoney * 0.95)
        await runner.finish('hack.script', 50);
    ns.print(`money less than ${asPercent(0.95)}...`);

    await weaken(ns, minSecurity, runner);
    let growGives = 0;
    while (growGives < 0.000001) {
        let curr = ns.getServerMoneyAvailable(target);
        await runner.finish('grow.script');
        growGives = Math.abs((ns.getServerMoneyAvailable(target) - (curr + 1)) / (curr + 1));
    }
    ns.print(`got growth as ${asPercent(growGives)}...`);

    while (ns.getServerMoneyAvailable(target) < Math.min(1000000, ns.getServerMaxMoney(target)))
        await runner.finish('grow.script', 10000);
    ns.print('got at least 1.000.000 in server...');


    let money = ns.getServerMoneyAvailable(target);
    await weaken(ns, minSecurity, runner);
    while (ns.getServerMoneyAvailable(target) === money)
        await runner.finish('hack.script');
    let hackTakes = (money - ns.getServerMoneyAvailable(target)) / money;
    ns.print(`got hack as ${asPercent(hackTakes)}`);

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

    ns.print('Growing server to 100%');
    while (ns.getServerMoneyAvailable(target) < maxMoney) {
        ns.print(`At ${asPercent(ns.getServerMoneyAvailable(target) / maxMoney)}`);
        let money = ns.getServerMoneyAvailable(target);
        let need = (maxMoney - money) / money;
        let threads = Math.ceil(need / growGives);
        await runner.finish('grow.script', threads);
    }
    await weaken(ns, minSecurity, runner);

    await runner.start('hack.js', threads.hack, `${target};${threads.grow};${threads.weak};${taking}`);
}