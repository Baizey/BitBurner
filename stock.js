import {
    asPercent,
    display
} from 'helper.ns';

// 100 million as minimum money to buy shares with
let minBuyUsing = 100 * Math.pow(10, 6);
// Keep 1% on hand
let keepOnHand = 0.01;

// Thresholds for buying/selling compared to the stocks forecast
let sellThreshold = 0.55;
let buyThreshold = 0.6;
// The higher, the more forecast differences mean
let shareMultiplier = 5;

class Stock {
    constructor(ns, name) {
        this.ns = ns;
        this.name = name;
        this.amount = ns.getStockPosition(name)[0];
        this.avgBuyPrice = ns.getStockPosition(name)[1];
        this.price = 0;
        this.forecast = 0;
    }

    update() {
        let ns = this.ns;
        this.forecast = ns.getStockForecast(this.name);
        this.amount = ns.getStockPosition(this.name)[0];
        this.avgBuyPrice = ns.getStockPosition(this.name)[1];
        this.price = ns.getStockPrice(this.name);
        this.share = Math.sqrt((this.forecast - (buyThreshold - 0.01)) * shareMultiplier);
    }

    buy(using) {
        using = Math.floor(using);
        if (using < minBuyUsing)
            return;

        let price = this.ns.getStockPrice(this.name);
        let shares = Math.floor(using / price);
        if (shares <= 0)
            return;

        this.ns.buyStock(this.name, shares);
        this.amount += shares;
    }

    sell() {
        if (this.amount <= 0)
            return;
        this.ns.sellStock(this.name, this.amount);
        this.amount = 0;
    }

    total() {
        return this.amount * this.price;
    }

    profit() {
        return this.amount * (this.price - this.avgBuyPrice);
    }

    toString(totalValue) {
        return [
            `${this.name.padEnd(5, '.')}: `,
            ` Value: ${display(this.total())}`,
            ` Percent: ${asPercent(this.total() / totalValue)}`,
            ` Profit: ${display(this.profit())}`,
            ` Forecast: ${asPercent(this.forecast.toFixed(2))}`
        ].join('');
    }
}

export async function main(ns) {
    let symbols = ns.getStockSymbols().map(s => new Stock(ns, s));
    symbols.forEach(s => s.sell());
    ns.disableLog('getServerMoneyAvailable');
    ns.disableLog('buyStock');
    ns.disableLog('sleep');
    while (true) {
        // Update stock info
        symbols.forEach(stock => stock.update());
        // Figure out if any stock has changed position
        // I.e. we own a stock with poor forecast or we dont own a stock with good forecast
        let changes = symbols.filter(s => (s.forecast <= sellThreshold && s.amount > 0) || (s.forecast >= buyThreshold && s.amount === 0));

        // If stock positions has changed
        // Sell all stocks and rebuy the good ones in proportion to their forecast
        if (changes.length > 0) {
            symbols.forEach(s => s.sell());
            let avail = Math.floor(ns.getServerMoneyAvailable("home") * (1 - keepOnHand));
            let stocks = symbols.filter(s => s.forecast >= buyThreshold);
            let totalShare = 0;
            for (let i in stocks) totalShare += stocks[i].share;
            stocks.forEach(s => s.buy(avail * (s.share / totalShare)));
        }

        // Get data to print for display
        let print = [];
        let cash = ns.getServerMoneyAvailable("home");
        let total = cash;
        let profit = 0;
        symbols.forEach(stock => {
            stock.update();
            profit += stock.profit();
            total += stock.total();
        });
        symbols.sort((a, b) => b.forecast - a.forecast).forEach(stock => {
            if (stock.amount > 0)
                print.push(stock.toString(total));
        });

        print.unshift(`CASH.: Value: ${display(cash)} Percent: ${asPercent(keepOnHand)}`);
        print.unshift(`TOTAL: Value: ${display(total)} Profit: ${display(profit)}`);
        ns.clearLog();
        ns.print(print.join('<br>'));

        await ns.sleep(5000);
    }
}