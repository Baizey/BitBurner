/**
 * Just here to let the IDE know how the ns argument in all main functions look
 */
class Ns {

    Ns() {
        this.codingcontract = new Codingcontract();
        this.args = [];
    }

    ls(target, filetype){}
    disableLog(fn){}
    enableLog(fn){}
    getServerMoneyAvailable(target){}
    getServerRequiredHackingLevel(target){}
    print(stuff){}
    tprint(stuff){}
    getServerMaxMoney(target){}
    getServerMinSecurityLevel(target){}
    getServerSecurityLevel(target){}
    scan(target){}
    getServerRam(target){}
    hasRootAccess(target){}
    fileExists(filename){}
    getServerNumPortsRequired(target){}

    getStockSymbols();
    sellStock(symbol);
    buyStock(symbol);
    getStockForecast(symbol);
    getStockPosition(symbol);
    getStockPrice(symbol);

    getHostname(){}
    getHackingLevel(){}

    isRunning(script, host, ...args){}

    nuke(target){}
    brutessh(target){}
    ftpcrack(target){}
    relaysmtp(target){}
    httpworm(target){}
    sqlinject(target){}

    async sleep(time){}
    async run(time){}
    async exec(time){}
    async kill(time){}
    async hack(time){}
    async grow(time){}
    async weaken(time){}
    async prompt(time){}
    async wget(time){}
}

class Codingcontract {
    getContractType(fn, server){}
    getDescription(fn, server){}
    getData(fn, server){}
    attempt(answer, fn, server){}
}