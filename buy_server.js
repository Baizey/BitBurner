/**
 * @param {import("Ns").NS } ns
 * @returns {void}
 */
export async function main(ns) {
    const [amount, name] = ns.args;
    const realAmount = Math.pow(2, +amount);

    ns.tprint(`Server will have ${realAmount} GB ram`);
    ns.tprint(`Server will cost ${ns.getPurchasedServerCost(realAmount)}`);

    try {
        ns.purchaseServer(name || 'server', realAmount);
        ns.tprint(`Bought server`);
    } catch (e) {
        ns.tprint(`Failed buying server: ${e.message}`);
    }
}