import {inject, cmd} from "helper.js";

let getBody = x => `let ${x} = document.getElementsByTagName("BODY")[0];`;

export async function main(ns) {
    let code = [
        "let screen = document.createElement('div')",
        "screen.style.width = '100%'",
        "screen.style.height = '100%'",
        "screen.style.position = 'absolute'",
        "screen.style.zIndex = 999",
        "screen.style.backgroundColor = 'green'",
        "body = document.getElementById('entire-game-container')",
        "body.appendChild(screen);",
        "alert('happy injection');"
    ].join(";");
    inject(ns, code);
}