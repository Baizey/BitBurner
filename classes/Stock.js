// 100 million as minimum money to buy shares with
let minimumAmountToBuyWith = 100 * Math.pow(10, 6);

export class StockSettings {
    constructor(keepOnHand = .01,
                sellThreshold = .55,
                buyThreshold = .6,
                shareMultiplier = 5,
                minBuyUsing = minimumAmountToBuyWith) {
        this.sellThreshold = sellThreshold;
        this.keepOnHand = keepOnHand;
        this.buyThreshold = buyThreshold;
        this.shareMultiplier = shareMultiplier;
        this.minBuyUsing = minBuyUsing
    }

    static standard() {
        return new StockSettings();
    }
}

let defaultSettings = StockSettings.standard();

export class Stock {

    static getAllStocks(ns, settings = defaultSettings) {
        return ns.getStockSymbols().map(s => new Stock(ns, s, settings));
    }

    constructor(ns, name, settings = defaultSettings) {
        this.settings = settings;
        this.ns = ns;
        this.name = name;
        this.amount = ns.getStockPosition(name)[0];
        this.avgBuyPrice = ns.getStockPosition(name)[1];
        this.price = 0;
        this.forecast = 0;
    }

    update() {
        let settings = this.settings;
        let ns = this.ns;
        this.forecast = ns.getStockForecast(this.name);
        this.amount = ns.getStockPosition(this.name)[0];
        this.avgBuyPrice = ns.getStockPosition(this.name)[1];
        this.price = ns.getStockPrice(this.name);
        this.share = Math.sqrt((this.forecast - (settings.buyThreshold - 0.01)) * settings.shareMultiplier);
    }

    shouldAct(){
        return this.shouldBuy() || this.shouldSell();
    }

    shouldSell() {
        return this.forecast <= this.settings.sellThreshold && this.amount > 0;
    }

    shouldBuy() {
        return this.forecast >= this.settings.buyThreshold && this.amount === 0;
    }

    buy(using) {
        let settings = this.settings;
        let ns = this.ns;
        using = Math.floor(using);
        if (using < settings.minBuyUsing)
            return;

        let buyAmount = Math.floor(using / ns.getStockPrice(this.name));
        if (buyAmount <= 0)
            return;

        ns.buyStock(this.name, buyAmount);
        this.amount += buyAmount;
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
}