import {asPercent, display} from 'helper.js';
import {Stock, StockSettings} from 'Stock.js';

// Leaving settings as global so that the script can be used to change settings on the fly
let settings = StockSettings.standard();

export async function main(ns) {
    ns.disableLog('ALL');
    let stocks = Stock.getAllStocks(ns, settings);
    // Initial cleanup on loading game
    stocks.forEach(s => s.sell());

    while (true) {
        // Update stock info
        stocks.forEach(stock => stock.update());
        // Check if any stock needs to be sold/bought
        if (stocks.some(s => s.shouldAct())) {
            // Sell all stocks to redistribute
            stocks.forEach(s => s.sell());
            // Calculate how much cash is available
            let avail = Math.floor(ns.getServerMoneyAvailable("home") * (1 - settings.keepOnHand));
            // Find stocks to distribute between
            let toBuy = stocks.filter(s => s.shouldBuy());
            // Find total share between stocks to buy
            let totalShare = toBuy.reduce((state, item) => state + item.share, 0);
            // Buy amount according to their individual share
            toBuy.forEach(s => s.buy(avail * (s.share / totalShare)));
        }
        // Wait for stock info to update
        await ns.sleep(5000);
    }
}