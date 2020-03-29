import { unlink, readFileSync } from 'fs';
import Jimp from 'jimp';
import fetch from 'node-fetch';

const jimp: Jimp = require('jimp');
const profile_pic = 'https://cdn.discordapp.com/avatars/309176098590294026/531d8879a9929364290785323c02948e.jpg';
// const postURL = 'http://localhost:8080/';
const postURL = 'http://10.0.0.31:8080/';
const filename = './img.bmp';

// send image to client
function postImage() {
    const compress = (): string => {
        const getByteArray = (): number[] => {
            const fileData = readFileSync(filename).toString('hex');
            const result = [];
            for (let i = 0; i < fileData.length; i += 2)
                result.push(Number(`0x${fileData[i]}${fileData[i + 1]}`));
            return result;
        };
        const chars = Array(256).fill(null).map((v, i) => String.fromCharCode(i));
        return getByteArray().map(x => chars[Number(x)]).join('');
    };
    const payload = {img: compress()};
    return fetch(postURL, {
        method: 'post',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    }).then(response => response.json());
}

async function getTime(): Promise<typeof jimp> {
    const background = new jimp(400, 32, '#FFFFFF');
    const font = await jimp.loadFont(jimp.FONT_SANS_32_BLACK);
    const now = new Date().toString();
    const removeSeconds = false;
    const time = now.substr(0, now.indexOf(' GMT') - (removeSeconds ? 3 : 0));
    background.print(font, 0, 0, {
        text: time,
        alignmentX: jimp.HORIZONTAL_ALIGN_CENTER,
        alignmentY: jimp.VERTICAL_ALIGN_BOTTOM
    }, background.bitmap.width, background.bitmap.height);
    return background;
}

async function createImage() {
    const displayWidth = 400;
    const displayHeight = 300;

    const background = new jimp(displayWidth, displayHeight, '#FFFFFF');

    const avatar = await jimp.read(profile_pic);

    background.composite(await getTime(), 0, displayHeight - 32);

    const x = 60 + Math.floor(Math.random()
        * (background.bitmap.width - avatar.bitmap.width - 120));
    const y = 50 + Math.floor(Math.random()
        * (background.bitmap.height - avatar.bitmap.height - 100));
    background.composite(avatar, x, y);

    await background.grayscale();
    await background.contrast(1);
    await background.writeAsync(filename);
}

// main loop
function main() {
    console.log('Creating Image');
    createImage().then(() => {
        console.log('Sending Image');
        return postImage().then(resp => {
            console.log(resp);
            setTimeout(() => {
                unlink(filename, async err => {
                    if (err) throw err;
                    main();
                });
            }, 15000);
        });
    })
    .catch(console.error);
}

main();
