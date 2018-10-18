import {asPercent, display} from 'helper.js';
import {Stock} from 'Stock.js';

export async function main(ns) {
    ns.disableLog('ALL');
    let stocks = Stock.getAllStocks(ns);
    stocks.forEach(s => s.sell());
    while (true) {
        stocks.forEach(stock => stock.update());
        if (stocks.some(s => s.shouldAct())) {
            stocks.forEach(s => s.sell());
            let avail = Math.floor(ns.getServerMoneyAvailable("home") * (1 - Stock.keepOnHand()));
            let toBuy = stocks.filter(s => s.shouldBuy());
            let totalShare = toBuy.reduce((state, item) => state + item.share, 0);
            toBuy.forEach(s => s.buy(avail * (s.share / totalShare)));
        }
        await ns.sleep(5000);
    }
}