import {Stock} from 'stock.js';
import {asPercent, asFormat} from 'helper.js';

let asTitle = (text, length, symbol = '~') => symbol.repeat(Math.floor((length - text.length) / 2)) + text + symbol.repeat(Math.ceil((length - text.length) / 2));

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

        let used = stocks
            .filter(s => s.amount > 0)
            .sort((a, b) => b.forecast - a.forecast);
        let hasStocks = used.length > 0;
        used.unshift({total: cash, profit: 0});
        used.unshift({total: total, profit: profit});

        let values = asFormat(used.map(s => s.total));
        let profits = asFormat(used.map(s => s.profit));
        let valuesPercent = asPercent(used.map(s => s.total / total));
        let profitsPercent = asPercent(used.map(s => s.profit / profit));

        for (let i = 2; i < used.length; i++)
            print.push(`${used[i].name.padEnd(5, ' ')}: Value: ${values[i]} Percent: ${valuesPercent[i]} Profit: ${profits[i]} Percent: ${profitsPercent[i]}`);

        let length = !hasStocks ? 20 : print[0].length;

        if (hasStocks) print.unshift(asTitle('STOCKS', length));

        print.unshift(`${'CASH'.padEnd(5, ' ')}: Value: ${values[1]} Percent: ${valuesPercent[1]}`);
        print.unshift(asTitle('LIQUID', length));
        let valuesLength = `Percent: ${valuesPercent[0]}`.length;
        let profitsLength = `Percent: ${profitsPercent[0]}`.length;
        print.unshift(`TOTAL: Value: ${values[0]} ${' '.repeat(valuesLength)} Profit: ${profits[0]} ${' '.repeat(profitsLength)}`);
        print.unshift('');

        ns.clearLog();
        ns.print(print.join('<br>'));
        await ns.sleep(updateRate);
    }

}