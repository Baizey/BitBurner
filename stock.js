import {asPercent, display} from 'helper.js';
import {Stock, StockSettings} from 'Stock.js';

let settings = StockSettings.standard();
let needToUpdate = false;

export async function main(ns) {
    ns.disableLog('ALL');

    if (ns.args.length > 0) {
        ns.args.forEach(arg => {
            arg = arg.split(':').map(n => n.trim());
            switch (arg[0]) {
                case 'hand':
                    settings.keepOnHand = arg[1] - 0;
                    break;
                case 'sell':
                    settings.sellThreshold = arg[1] - 0;
                    break;
                case 'buy':
                    settings.buyThreshold = arg[1] - 0;
                    break;
                case 'min':
                    settings.minBuyUsing = Math.pow(10, arg[1]);
                    break;
            }
        });
        return (needToUpdate = true);
    }

    let stocks = Stock.getAllStocks(ns, settings);
    stocks.forEach(s => s.sell());
    while (true) {
        stocks.forEach(stock => stock.update());
        if (needToUpdate || stocks.some(s => s.shouldAct())) {
            needToUpdate = false;
            stocks.forEach(s => s.sell());
            let avail = Math.floor(ns.getServerMoneyAvailable("home") * (1 - settings.keepOnHand));
            let toBuy = stocks.filter(s => s.shouldBuy());
            let totalShare = toBuy.reduce((state, item) => state + item.share, 0);
            toBuy.forEach(s => s.buy(avail * (s.share / totalShare)));
        }
        await ns.sleep(5000);
    }
}