import express from 'express';
import * as cors from 'cors';
import * as fs from 'fs';

// get router
const router = express.Router();

// options for cors midddleware
const options: cors.CorsOptions = {
  allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'X-Access-Token'],
  credentials: true,
  methods: 'GET,HEAD,OPTIONS,PUT,PATCH,POST,DELETE',
  origin: 'http://localhost:3000/',
  preflightContinue: false
};

// use cors middleware
router.use(cors.default(options));
router.options('*', cors.default(options));

const app = express();
app.use(express.json({limit: '1mb'}));
const port = 8080;

// get
app.get('/', ( req, res ) => {
    res.send('<div>Hello World!</div>');
});

// post
app.post('/', (req, res) => {
    console.log('--------------------------------');
    const decompress = (array: string) => array.split('').map(x => x.charCodeAt(0));
    fs.writeFileSync('../img/img.bmp', Buffer.from(new Uint8Array(decompress(req.body['img']))));
    console.log('--------------------------------');
    res.send({response: 'success'});
});

// start the express server
app.listen(port, () => {
    console.log(`server started at http://localhost:${ port }`);
});
