import fs from "fs";
import path from "path";

const __dirname = import.meta.dirname;
const dirHalaman = path.join(__dirname, "../halaman/");
const dirKomponen = path.join(__dirname, "../komponen/");
const regex = /<\/?komponen\s+([^>\s]+)\s*\/?>/g;

let komponenCache = new Map();
let halamanCache = new Map();
let fileWatcherActive = false;

export function watchFiles() {
    if (fileWatcherActive) return; // Prevent duplicate watchers
    fileWatcherActive = true;
    
    // Watch komponen folder
    fs.watch(dirKomponen, (event, filename) => {
        if (filename && filename.endsWith(".html")) {
            const name = filename.replace(".html", "");
            console.log(`[reload] Komponen changed: ${name}`);
            komponenCache.delete(name); // invalidate
        }
    });

    // Watch halaman folder
    fs.watch(dirHalaman, (event, filename) => {
        if (filename && filename.endsWith(".html")) {
            const name = filename.replace(".html", "");
            console.log(`[reload] Halaman changed: ${name}`);
            halamanCache.delete(name); // invalidate
        }
    });
}

export function injectIntoHead(html, injectHead) {
    if (!injectHead) return html;
    const injectStr = Array.isArray(injectHead) ? injectHead.join("\n") : injectHead;

    if (/<\/head>/i.test(html)) {
        // Insert before closing </head>
        return html.replace(/<\/head>/i, `${injectStr}\n</head>`);
    } else {
        // If no <head> tag, just append at the top
        return injectStr + "\n" + html;
    }
}

export function prosesKomponen(komponen) {
    if (komponenCache.has(komponen)) {
        return komponenCache.get(komponen);
    }

    const filePath = path.join(dirKomponen, komponen + ".html");
    if (!fs.existsSync(filePath)) {
        console.warn(`Komponen "${komponen}" tidak ditemukan: ${filePath}`);
        return "";
    }

    let data = fs.readFileSync(filePath, "utf8");

    const set = [...new Set([...data.matchAll(regex)].map(m => m[1]))];

    for (const e of set) {
        const re = new RegExp(`<komponen\\s+${e}\\s*\\/?>`, "g");
        const nested = prosesKomponen(e);
        data = data.replaceAll(re, nested);
    }

    komponenCache.set(komponen, data);
    return data;
}

export default function prosesHalaman(halaman) {
    if (halamanCache.has(halaman)) {
        return halamanCache.get(halaman);
    }

    const filePath = path.join(dirHalaman, halaman + ".html");
    if (!fs.existsSync(filePath)) {
        console.warn(`Halaman "${halaman}" tidak ditemukan: ${filePath}`);
        return "";
    }

    let data = fs.readFileSync(filePath, "utf8");

    const set = [...new Set([...data.matchAll(regex)].map(m => m[1]))];

    for (const e of set) {
        const re = new RegExp(`<komponen\\s+${e}\\s*\\/?>`, "g");
        const komponenData = prosesKomponen(e);
        data = data.replaceAll(re, komponenData);
    }

    // Base injections (favicon + meta)
    data = injectIntoHead(data, [
        '<link rel="icon" href="/public/lglogo.png">',
        '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">',
        '<meta charset="UTF-8">'
    ])

   try {
        if (["utama", "daftarlogin", "panduan", "kontak"].includes(halaman)) {
            const navbarCssPath = path.join(__dirname, '../public/navbar.css');
            if (fs.existsSync(navbarCssPath)) {
                const navbarCss = fs.readFileSync(navbarCssPath, 'utf8');
                const navbarStyleTag = `<style id="inline-navbar-css">\n${navbarCss}\n</style>`;
                data = injectIntoHead(data, navbarStyleTag);
            }
        }
    } catch (err) {
        console.error('Gagal meng-inline navbar CSS:', err.message);
    }

    // console.log(data);

    halamanCache.set(halaman, data);
    return data;
}
