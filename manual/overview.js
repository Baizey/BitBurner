import {Stock} from 'Stock.js';
import {asPercent, display, cmd} from 'helper.js';

export async function main(ns) {
    ns.disableLog('ALL');
    let stocks = Stock.getAllStocks(ns);
    let updateRate = ns.args[0] || 5000;

    while (true) {
        let print = [''];
        let cash = ns.getServerMoneyAvailable("home");
        let total = cash;
        let profit = 0;
        stocks.forEach(stock => {
            stock.update();
            profit += stock.profit();
            total += stock.total();
        });

        print.push(`TOTAL: Value: ${display(total)} Percent: 100% Profit: ${display(profit)} Percent: 100%`);
        print.push(`${'~'.repeat(29)}LIQUID${'~'.repeat(29)}`);
        print.push(`CASH.: Value: ${display(cash)} Percent: ${asPercent(cash / total)}`);
        print.push(`${'~'.repeat(29)}STOCKS${'~'.repeat(29)}`);


        let used = stocks
            .sort((a, b) => b.forecast - a.forecast)
            .filter(s => s.amount > 0);
        let values = display(used.map(s => s.total()));
        let profits = display(used.map(s => s.profit()));

        for(let i = 0; i < used.length; i++) {
            let stock = used[i];
            print.push(`${stock.name.padEnd(5, ' ')}: Value: ${values[i]} Percent: ${asPercent(stock.total() / total)} Profit: ${profits[i]} Percent: ${asPercent(stock.profit() / profit)}`);
        }

        ns.clearLog();
        ns.print(print.join('<br>'));
        await ns.sleep(updateRate);
    }

}