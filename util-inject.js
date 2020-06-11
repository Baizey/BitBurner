
export function utilInject(ns, code) {
    let id = ("" + Math.random() + Math.random()).replace(/\./g, '');
    let output = `<div id='${id}' style="position:absolute; width: 100%; height:100%" onmouseenter="if (typeof inject_${id} !== 'undefined') return;inject_${id} = true;document.getElementById('${id}').remove();${code}"></div>`;
    ns.tprint(output);
}

export function cmd(ns, cmd) {
    let code = `
        document.getElementById('terminal-input-text-box').value = '${cmd}';
        document.body.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, cancelable: true, keyCode: 13 }));
    `;
    utilInject(ns, code);
}