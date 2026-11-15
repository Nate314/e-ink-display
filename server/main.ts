import { unlink, readFileSync } from 'fs';
import { Jimp, loadFont, HorizontalAlign, VerticalAlign } from 'jimp';
import { SANS_16_BLACK } from 'jimp/fonts';

type Image = InstanceType<typeof Jimp>;
const profile_pic = 'https://cdn.discordapp.com/avatars/309176098590294026/531d8879a9929364290785323c02948e.jpg';
// const postURL = 'http://localhost:8080/';
const postURL = process.env.CLIENT_URL || 'http://10.0.0.31:8080/';
const filename = './img.bmp';
const BLACK = 0x000000ff;
const WHITE = 0xffffffff;

// returns the information in the xth tag from the html data passed
const getxtag = (data: string, tag: string, x: number) => {
    let result: string = data?.split(`<${tag}`)[x]?.split('>')[1]?.split(`</${tag}>`)[0];
    result = result?.substr(0, Math.max(result.length - (tag.length + 2), 0));
    result = result?.replace('&amp;', '&');
    return result;
};

// returns the html behind the specified url
function getURL(url: string): Promise<string> {
    return fetch(url).then(response => response.text());
}

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
        const chars = Array(256).fill(null).map((_, i) => String.fromCharCode(i));
        const result = getByteArray().map(x => chars[Number(x)]).join('');
        // console.log(result);
        return result;
    };
    const payload = {img: compress()};
    // writeFileSync('./payload.json', JSON.stringify(payload));
    return fetch(postURL, {
        method: 'post',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    }).then(response => response.json());
}

// returns the current date, day, and time
function getTimeObject(): { date: string, day: string, time: string } {
    const now = new Date(new Date().toLocaleString('en-US', {timeZone: "America/Chicago"})).toString();
    const time = now.substr(0, now.indexOf(' GMT'));
    const partial_days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const full_days = ['', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const partial_months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const full_months = ['', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const { day, month, date, year, hour, minute, second } = {
        day: full_days[partial_days.indexOf(time.split(' ')[0]) + 1],
        month: full_months[partial_months.indexOf(time.split(' ')[1]) + 1],
        hour: Number(time.split(' ')[4].split(':')[0]),
        minute: Number(time.split(' ')[4].split(':')[1]),
        second: Number(time.split(' ')[4].split(':')[2]),
        date: time.split(' ')[2],
        year: time.split(' ')[3],
    };
    const preciseminute = minute + (second / 60);
    const pwz = str => `${str}`.padStart(2, '0'); // pad with zeros
    const t12h = hour => hour > 12 ? hour - 12 : hour; // return 12 hour time from 24 hour time
    const hour_options: string[] = [t12h(hour + Number(preciseminute > 30)) + ` o'clock`, t12h(hour), t12h(hour), t12h(hour + 1)];
    const minute_options: string[] = ['', 'Quarter past', 'Half past', 'Quarter till'];
    const am_or_pm: string = (preciseminute > 7.5 && preciseminute < 52.5 ? '' : ' ') + ['am', 'pm'][Number(hour >= 12)];
    return {
        date: `${month} ${pwz(date)} ${year}`, day: `${day}`,
        time: `${minute_options[Math.round(preciseminute / 15) % 4]} ${hour_options[Math.round(preciseminute / 15) % 4] + am_or_pm}`
    };
}

function getBorder(width: number, height: number, borderThickness: number): Image {
    // jimp 1.x needs whole pixel sizes, callers pass thirds of the display
    width = Math.floor(width);
    height = Math.floor(height);
    const box = new Jimp({ width, height, color: BLACK });
    const innerbox = new Jimp({ width: width - borderThickness, height: height - borderThickness, color: WHITE });
    box.composite(innerbox, borderThickness / 2, borderThickness / 2);
    return box;
}

// returns the date, day of the week, and fuzzy time in one 400x32 image
async function getTimeImage(): Promise<Image> {
    const background = new Jimp({ width: 400, height: 32, color: WHITE });
    const thirdwidth = background.bitmap.width / 3;
    const height = background.bitmap.height;
    const { date, day, time } = getTimeObject();
    const font = await loadFont(SANS_16_BLACK);
    const args = (str: string, pos: number) => ({
        font, x: pos * thirdwidth, y: 0,
        text: { text: str, alignmentX: HorizontalAlign.CENTER, alignmentY: VerticalAlign.MIDDLE },
        maxWidth: thirdwidth, maxHeight: height
    });
    [date, day, time].forEach(async (v: string, i: number) => {
        await background.composite(getBorder(thirdwidth, height, 4), i * thirdwidth + Number(i > 0), 0);
        await background.print(args(v, i));
    });
    return background;
}

// returns the S&P500, Dow30, and Nasdaq info from yahoo finance
async function getStonksImage(): Promise<{ image: Image, stonk: boolean }> {
    const width = Math.floor(400 / 3);
    const height = 300 - 32 - 1;
    const background = new Jimp({ width, height, color: WHITE });
    await background.composite(getBorder(width, height, 4), 0, 0);
    const compose = async (data: {label, points, change, percentchange}[]) => {
        const thirdheight = height / 3;
        const font = await loadFont(SANS_16_BLACK);
        const args = (str: string, offset: number, pos: number) => ({
            font, x: 0, y: (pos * thirdheight) + offset + (thirdheight * 0.2),
            text: { text: str, alignmentX: HorizontalAlign.CENTER, alignmentY: VerticalAlign.TOP },
            maxWidth: width, maxHeight: thirdheight
        });
        data.forEach(async (v: {label, points, change, percentchange}, i: number) => {
            const text = [v.label, v.points, `${v.change} (${v.percentchange})`.replace('((', '(').replace('))', ')')];
            await background.composite(getBorder(width, thirdheight, 2), 0, i * thirdheight);
            text.forEach(async (line, lineNumber) => await background.print(args(line, -10 + (20 * lineNumber), i)));
        });
        data.map(x => console.log(x.percentchange.substr(0, 1)));
        const stonk: boolean = data.map(x => x.percentchange.substr(0, 1) === '+').filter(x => x).length >= 2;
        return { image: background, stonk: stonk };
    }
    return new Promise<{ image: Image, stonk: boolean }>(async resolve => {
        const body = await getURL('http://finance.yahoo.com/');
        resolve(await compose((body.split('class="Maw(160px)"').filter((_, i) => i !== 0 && i <= 3).map(x => x.split('</h3>')[0])
            .map(data => {
                return {
                    label: getxtag(data, 'a', 1),
                    points: getxtag(data, 'fin-streamer', 1),
                    change: getxtag(data, 'span', 1),
                    percentchange: getxtag(data, 'span', 2)
                };
            }))));
    });
}

// returns an analog clock picture
async function getAnalogClockImage(width: number, height: number, stonk: boolean): Promise<Image> {
    const background = new Jimp({ width, height, color: BLACK });
    // TODO: render analog clock
    const image = await Jimp.read('https://i.etsystatic.com/10316556/r/il/3129fa/1990666656/il_570xN.1990666656_dilw.jpg');
    await image.rotate(stonk ? 0 : 180);
    await image.resize({ w: 250, h: 250 });
    await image.greyscale();
    await image.contrast(1);
    await background.composite(image, 5, 5);
    return background;
}

// returns image to send to e-ink display
async function createImage() {
    const displayWidth = 400;
    const displayHeight = 300;
    const background = new Jimp({ width: displayWidth, height: displayHeight, color: WHITE });
    const { x, y, width, height } = {
        x: (displayWidth / 3) + 2, y: 2,
        width: Math.floor(displayWidth - ((displayWidth / 3) + 4)),
        height: displayHeight - 32 - 4
    }

    // compose images together
    const result = await getStonksImage();
    await background.composite(result.image, 0, 0);
    await background.composite(await getTimeImage(), 0, displayHeight - 32);
    await background.composite(await getAnalogClockImage(width, height, result.stonk), x, y);

    // convert to black and white and write image to disk
    await background.greyscale();
    await background.contrast(1);
    await background.write(filename);
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
            }, 60 * 1000);
        });
    })
    .catch(console.error);

    // createImage().then(() => {
    //     setTimeout(() => {
    //         main();
    //     }, 5000);
    // });
}

main();
