import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import https from 'https';
import fs from 'fs';
import cors from 'cors';
import { auth, requiresAuth } from 'express-openid-connect';
import { auth as auth2 } from 'express-oauth2-jwt-bearer';
import { insertTicket, getLotoNumbersById, getResultByRoundId, 
  getTicketsCount, getLastRoundId, openNewRound, 
  closeRound, insertResultNumbersManual, getOpenRoundId } from './database';
import QRCode from 'qrcode';

dotenv.config();
const app = express();
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "pug");

const externalUrl = process.env.RENDER_EXTERNAL_URL;
const port = process.env.PORT ? parseInt(process.env.PORT) : 4010;
const hostname = externalUrl ? '0.0.0.0' : '127.0.0.1';

app.use(cors());
app.use(express.json());

const config = {
    authRequired: false,
    auth0Logout: true,
    secret: process.env.OIDC_SECRET,
    baseURL: process.env.OIDC_BASE_URL,
    clientID: process.env.OIDC_CLIENT_ID,
    issuerBaseURL: process.env.OIDC_ISSUER_BASE_URL
};

app.use(auth(config));

const jwtCheck = auth2({
  audience: 'https://web2loto/api',
  issuerBaseURL: 'https://dev-pu5ikuuzt4xlqtzg.us.auth0.com/',
});


app.get('/', async (req, res) => {  
    const ticketCount = await getTicketsCount();
    const roundId = await getLastRoundId();
    const resultNums = await getResultByRoundId(roundId);

    res.render('index', 
        {isAuthenticated: req.oidc.isAuthenticated(),
        user: req.oidc.user, 
        ticketCount: ticketCount,
        resultNums: resultNums});
});

app.get('/entry-ticket', requiresAuth(),function (req, res) {  
  res.render('entryticket');
});

app.post('/new-ticket', requiresAuth(), async (req, res) => {
  try {
      const auth0Id = req.oidc.user.sub;
      const { idNumber, lotoNumbers } = req.body;

      const ticketId = await insertTicket(auth0Id, idNumber, lotoNumbers);

      if (!ticketId) {
        res.status(400)
        res.end("Bad request: no open round");
        return;
      }

      const url = `https://localhost:4010/loto-numbers/${ticketId}`;

      const qrData = await QRCode.toDataURL(url);
      res.json({
          qrCode: qrData,
          url: url
        }); 
  } catch (err) {
      console.error(err);
      res.status(500).send("Greška pri kreiranju ticketa " + err);
  }
});

app.get('/loto-numbers/:uuid', async (req, res) => {
  const lotoTicket = await getLotoNumbersById(req.params.uuid);
  const resultNums = await getResultByRoundId(lotoTicket.round_id);

  res.render("lotonums",  {lotoNums: lotoTicket.numbers, resultNums: resultNums});
});


app.post('/new-round', jwtCheck, async function(req, res) {
  try {
    const result = await openNewRound();
    if(result) {
      res.status(200);
      res.end("Uspješno otvorena nova runda!");
    } else {
      res.status(204);
      res.end("Runda je već otvorena.");
    }
  } catch(err) {
    console.log(err);
    res.status(500);
    res.end('Greška kod otvaranja novog kola.');
  }
})

app.post('/close', jwtCheck, async function(req, res) {
  try {
    const result = await closeRound();
    if(result) {
      res.status(200);
      res.end("Uspješno zatvaranje runde");
    } else {
      res.status(204);
      res.end("Nema aktivnih rundi");
    }
  } catch(err) {
    console.log(err);
    res.status(500);
    res.end('Greška kod zatvaranja kola.');
  }
})

app.post('/store-results', jwtCheck, async function(req, res) {
  try {
    const { numbers }: { numbers: number[] } = req.body;

    if (!numbers || numbers.length === 0) {
      res.status(400).end("Nije poslano ispravno polje brojeva");
      return;
    }

    const lastRoundId = await getLastRoundId();
    if (lastRoundId === 0) {
      res.status(400).end("Nema evidentiranih kola u bazi.");
      return;
    }

    const openRoundId = await getOpenRoundId();
    if (openRoundId !== 0) {
      res.status(400).end("Uplate su još aktivne!");
      return;
    }

    const existingResults = await getResultByRoundId(lastRoundId);
    if (existingResults !== null) {
      res.status(400).end("Rezultati ovog kola već su zabilježeni.");
      return;
    }

    await insertResultNumbersManual(lastRoundId, numbers);

    res.status(204)
    res.end("Uspješno spremanje rezultata!");

  } catch(err) {
    console.error('Greška kod spremanja rezultata kola:', err);
    res.status(500).end('Greška kod spremanja rezultata kola.');
  }
});


if (externalUrl) {
  app.listen(port, hostname, () => {
      console.log(`Server running on http://${hostname}:${port}/ and accessible externally at ${externalUrl}`);
  });
} else {
  https.createServer({
      key: fs.readFileSync('server.key'),
      cert: fs.readFileSync('server.cert')
  }, app).listen(port, () => {
      console.log(`Server running locally at https://localhost:${port}/`);
  });
}
  
