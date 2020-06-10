export async function main(ns) {
    const host = ns.args[0];
    const ram = ns.args[1];
    try {
        ns.purchaseServer(host, ram);
    } catch (e) {
        ns.tprint(e.message);
    }
}