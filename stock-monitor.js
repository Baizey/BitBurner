import {asPercent, asFormat} from "util-utils.js";
import {Stock} from "stock.js";

/**
 * @param {Ns} ns
 * @returns {Promise<void>}
 */
export async function main(ns) {
    const stocks = ns.getStockSymbols().map(e => new Stock(ns, e));
    ns.disableLog('ALL');
    while (true) {
        await ns.sleep(1000);

        stocks.sort((a, b) => b.purchasedTotalPrice - a.purchasedTotalPrice);

        const totalCurrentValue = stocks.map(e => e.currentTotalPrice).reduce((a, b) => a + b, 0);
        const totalPurchasedValue = stocks.map(e => e.purchasedTotalPrice).reduce((a, b) => a + b, 0);
        const totalGain = stocks.map(e => e.gains).reduce((a, b) => a + b, 0);

        ns.clearLog();
        ns.print(`TOTAL`)
        ns.print(`Total money: $${asFormat(totalCurrentValue)}`)
        ns.print(`Total Gains: $${asFormat(totalGain)} (${asPercent(totalGain / totalPurchasedValue)})`)
        ns.print('');

        for (let stock of stocks) {
            if (stock.purchasedAmount === 0) continue;
            ns.print(`${stock.symbol}, Forecast:  ${asPercent(stock.forecast)}`)
            ns.print(`Owned: ${asPercent(stock.purchasedAmountPercent)} ($${asFormat(stock.currentTotalPrice)})`)
            ns.print(`Gains: $${asFormat(stock.gains)} (${asPercent(stock.gainsPercent)})`)
            ns.print('');
        }

    }
}