/**
 * @param {Ns} ns
 * @returns {Promise<void>}
 */
export async function main(ns) {
    const stocks = ns.getStockSymbols().map(symbol => new Stock(ns, symbol));

    while (true) {
        stocks.sort((a, b) => b.forecast - a.forecast);

        stocks.filter(e => e.forecast <= 0.55).forEach(s => s.sellAll());
        stocks.filter(e => e.forecast >= 0.60).forEach(s => s.buyAll());

        await ns.sleep(5000);
    }
}

export class Stock {

    /**
     * @param {Ns} ns
     * @param {string} symbol
     */
    constructor(ns, symbol) {
        this._ns = ns;
        this.symbol = symbol;
        this.maxShares = ns.getStockMaxShares(symbol);
    }

    getMaxPurchaseAmount() {
        const type = 'Long';
        for (let buying = 1; buying > 0; buying -= 0.01) {
            const price = this._ns.getStockPurchaseCost(this.symbol, Math.floor(this.maxShares * buying), type);
            if (price < 1000 + this._ns.getServerMoneyAvailable('home'))
                return Math.floor(this.maxShares * buying);
        }
        return 0;
    }

    buyAll() {
        const amount = Math.min(this.maxShares - this.purchasedAmount, this.getMaxPurchaseAmount());
        if (amount > 0) this._ns.buyStock(this.symbol, amount);
    }

    sellAll() {
        return this._ns.sellStock(this.symbol, this.purchasedAmount);
    }

    get forecast() {
        return this._ns.getStockForecast(this.symbol);
    }

    get currentTotalPrice() {
        return this.purchasedAmount * this.currentPrice;
    }

    get currentPrice() {
        return this._ns.getStockPrice(this.symbol);
    }

    get gains() {
        return this.currentPrice * this.purchasedAmount - this.purchasedTotalPrice;
    }

    get gainsPercent() {
        return this.gains / this.purchasedTotalPrice;
    }

    get purchasedAmount() {
        return this._ns.getStockPosition(this.symbol)[0];
    }

    get purchasedAmountPercent() {
        return this.purchasedAmount / this.maxShares;
    }

    get purchasedPrice() {
        return this._ns.getStockPosition(this.symbol)[1];
    }

    get purchasedTotalPrice() {
        return this.purchasedAmount * this.purchasedPrice;
    }
}