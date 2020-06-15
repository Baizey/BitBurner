export async function main(ns) {
    const target = ns.args[0];
    const func = ns.args[1];
    const time = ns.args[2] - 0;
    if (time < Date.now())
        return;
    await ns.sleep(time - Date.now())
    await ns[func](target);
}

async function staticMemoryCalc(ns) {
    await ns.weaken('');
}