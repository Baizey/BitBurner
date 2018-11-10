import {Stock} from 'stock.js';
import {asPercent, asFormat} from 'helper.js';

export async function main(ns) {
    ns.disableLog('ALL');
    let stocks = Stock.get(ns);
    let updateRate = ns.args[0] || 5000;

    while (true) {
        let print = [''];
        let cash = ns.getServerMoneyAvailable("home");
        let total = cash;
        let profit = 0;
        stocks.forEach(stock => {
            stock.update();
            profit += stock.profit;
            total += stock.total;
        });

        print.push(`TOTAL: Value: ${asFormat(total)} Percent: 100% Profit: ${asFormat(profit)} Percent: 100%`);
        print.push(`${'~'.repeat(29)}LIQUID${'~'.repeat(29)}`);
        print.push(`CASH.: Value: ${asFormat(cash)} Percent: ${asPercent(cash / total)}`);
        print.push(`${'~'.repeat(29)}STOCKS${'~'.repeat(29)}`);

        let used = stocks
            .sort((a, b) => b.forecast - a.forecast)
            .filter(s => s.amount > 0);

        let values = asFormat(used.map(s => s.total));
        let profits = asFormat(used.map(s => s.profit));
        let valuesPercent = asPercent(used.map(s => s.total / total));
        let profitsPercent = asPercent(used.map(s => s.profit / profit));

        for (let i = 0; i < used.length; i++)
            print.push(`${used[i].name.padEnd(5, ' ')}: Value: ${values[i]} Percent: ${valuesPercent[i]} Profit: ${profits[i]} Percent: ${profitsPercent[i]}`);

        ns.clearLog();
        ns.print(print.join('<br>'));
        await ns.sleep(updateRate);
    }

}