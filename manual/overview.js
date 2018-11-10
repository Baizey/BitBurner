import {Stock} from 'stock.js';
import {asPercent, asFormat} from 'helper.js';

export async function main(ns) {
    ns.disableLog('ALL');
    let stocks = Stock.get(ns);
    let updateRate = ns.args[0] || 5000;

    while (true) {
        let print = [];
        let cash = ns.getServerMoneyAvailable("home");
        let total = cash;
        let profit = 0;
        stocks.forEach(stock => {
            stock.update();
            profit += stock.profit;
            total += stock.total;
        });

        print.push(`TOTAL: Value: ${asFormat(total)} Profit: ${asFormat(profit)}`);
        print.push(`${'~'.repeat(29)}LIQUID${'~'.repeat(29)}`);
        print.push(`CASH.: Value: ${asFormat(cash)} Percent: ${asPercent(cash / total)}`);
        print.push(`${'~'.repeat(29)}STOCKS${'~'.repeat(29)}`);

        let used = stocks
            .filter(s => s.amount > 0)
            .sort((a, b) => b.forecast - a.forecast);

        let values = asFormat(used.map(s => s.total));
        let profits = asFormat(used.map(s => s.profit));
        let valuesPercent = asPercent(used.map(s => s.total / total));
        let profitsPercent = asPercent(used.map(s => s.profit / profit));

        for (let i = 0; i < used.length; i++)
            print.push(`${used[i].name.padEnd(5, ' ')}: Value: ${values[i]} Percent: ${valuesPercent[i]} Profit: ${profits[i]} Percent: ${profitsPercent[i]}`);

        print.unshift(`CASH.: Value: ${asFormat(cash)} Percent: ${asPercent(cash / total)}`);
        print.unshift(`${'~'.repeat(33)}STOCKS${'~'.repeat(33)}`);
        if (used.length > 0) {
            let valuesLength = `Percent: ${valuesPercent[0]}`.length;
            let profitsLength = `Percent: ${profitsPercent[0]}`.length;
            print.unshift(`TOTAL: Value: ${asFormat(total)} ${' '.repeat(valuesLength)} Profit: ${asFormat(profit)} ${' '.repeat(profitsLength)}`);
            print.unshift(`${'~'.repeat(33)}LIQUID${'~'.repeat(33)}`);
        }
        print.unshift('');

        ns.clearLog();
        ns.print(print.join('<br>'));
        await ns.sleep(updateRate);
    }

}