import {getCracks} from 'helper.ns';

let nuke = 'nuke.exe';

export async function main(ns) {
    let cracks = getCracks();
    let target = ns.args[0];
    let need = ns.getServerNumPortsRequired(target);
    cracks.forEach(crack => {
        if (!ns.fileExists(crack))
            return;
        need--;
        ns[crack.split('.')[0]](target);
    });
    if (need <= 0 && ns.fileExists(nuke))
        ns.nuke(target);
}