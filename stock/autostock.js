import {getRunner} from 'runner.ns';

export async function main(ns) {
    let symbols = ns.getStockSymbols();
    let host = ns.getHostname();
    let runner = getRunner(ns, host, '');
    for(let i in symbols)
        await runner.start('stock.ns', 1, symbols[i]);
}