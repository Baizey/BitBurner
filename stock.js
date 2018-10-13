import {
    display
} from 'helper.ns';

// 1 billion
let minBuyUsing = 1 * Math.pow(10, 9);

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
        if (this.forecast > 0.6)
            this.buy();
        else if (this.forecast < 0.55)
            this.sell();
    }

    buy() {
        let ns = this.ns;
        let avail = ns.getServerMoneyAvailable("home");
        if (avail < minBuyUsing)
            return;

        let using = avail * 0.1;
        let price = ns.getStockPrice(this.name);
        let shares = Math.floor(using / price);
        if (shares <= 0)
            return;

        ns.buyStock(this.name, shares);
        this.amount += shares;
    }

    sell() {
        let ns = this.ns;
        if (this.amount <= 0)
            return;
        let total = ns.sellStock(this.name, this.amount);
        this.amount = 0;
    }

    total() {
        return this.amount * this.price;
    }

    profit() {
        return this.amount * (this.price - this.avgBuyPrice);
    }

    toString() {
        let str = `${this.name.padEnd(5, ' ')}: ${this.forecast.toFixed(2)}`;
        str += ` (Value: ${display(this.total())};`;
        str += ` Profit: ${display(this.profit())})`;
        return str;
    }

}

export async function main(ns) {
    let symbols = ns.getStockSymbols().map(s => new Stock(ns, s));
    ns.disableLog('getServerMoneyAvailable');
    ns.disableLog('buyStock');
    ns.disableLog('sleep');
    while (true) {
        let print = [];
        let total = 0;
        let profit = 0;
        symbols.forEach(stock => {
            stock.update();
            if (stock.amount > 0)
                print.push(stock.toString());
            profit += stock.profit();
            total += stock.total();
        });
        print.unshift(`Total: ${display(total)} (Profit: ${display(profit)})`);
        ns.clearLog();
        ns.print(print.join('<br>'));
        await ns.sleep(5000);
    }
}