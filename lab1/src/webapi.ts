import express from 'express';
import cors from 'cors';
import { auth } from 'express-oauth2-jwt-bearer';
import { openNewRound, closeRound, insertResultNumbersManual, getOpenRoundId, getLastRoundId, getResultByRoundId } from './database';

const app = express();
app.use(cors());
app.use(express.json())

const jwtCheck = auth({
  audience: 'https://web2loto/api',
  issuerBaseURL: 'https://dev-pu5ikuuzt4xlqtzg.us.auth0.com/',
});

app.use(jwtCheck);

app.post('/new-round', async function(req, res) {
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

app.post('/close', async function(req, res) {
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

app.post('/store-results', async function(req, res) {
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


const hostname = '127.0.0.1';
const port = 4091;

app.listen(port, hostname, () => {
  console.log(`✅ Web API running at http://${hostname}:${port}/`);
});
