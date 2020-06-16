/**
 * Just here to let the IDE know how the ns argument in all subarray functions look
 */
class Ns {

    Ns() {
        this.codingcontract = new Codingcontract();
        this.args = [];
    }

    /**
     * @returns {string[]}
     */
    getPurchasedServers(){
        return []
    };
    growthAnalyze(target, amount);
    hackAnalyzeThreads(target);
    getScriptRam(script);
    getServerGrowth(target);
    scp(files, source, target);
    ls(target, filetype){}
    disableLog(fn){}
    enableLog(fn){}
    clearLog(){}
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

    /**
     * Bitnode-4 functions
     */
    purchaseProgram(program){};
    purchaseTor(){};

    async sleep(time){}
    async run(script, numThreads=1, args){}
    async exec(script, host, numThreads=1, args = ''){}
    async kill(script, host, args = ''){}
    async hack(target){}
    async grow(target){}
    async weaken(target){}
    async prompt(question){}
    async wget(url, filename, ip = ''){}
}

class Codingcontract {
    getContractType(filename, server){}
    getDescription(filename, server){}
    getData(fn, server){}
    attempt(answer, filename, server){}
}