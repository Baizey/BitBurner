// 1 billion
let minBuyUsing = Math.pow(10, 9);

function Stock(ns, name){
    this.ns = ns;
    this.name = name;
    this.amount = ns.getStockPosition(name)[0];
    this.forecast = 0;
}

Stock.prototype.update = function(){
    let ns = this.ns;
    this.forecast = ns.getStockForecast(this.name);
    this.amount = ns.getStockPosition(this.name)[0];
}

Stock.prototype.buy = function(){
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

Stock.prototype.sell = function(){
    let ns = this.ns;
    if (this.amount <= 0)
        return;
    ns.sellStock(this.name, this.amount);
    this.amount = 0;
}

export async function main(ns) {
    let stock = new Stock(ns, ns.args[0]);
    while (true) {
        stock.update();
        ns.print(stock.forecast.toFixed(2));
        if (stock.forecast > 0.6)
            stock.buy();
        else if (stock.forecast < 0.55)
            stock.sell();
        await ns.sleep(10000);
    }
}