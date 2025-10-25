import express from 'express'
import dotenv from 'dotenv'
import path from 'path'
import https from 'https'
import fs from 'fs'
import { auth, requiresAuth } from 'express-openid-connect';
import { insertTicket, getLotoNumbersById, getResultByRoundId, 
  getTicketsCount, getLastRoundId } from './database';
import QRCode from 'qrcode'

dotenv.config();
const app = express();
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "pug");

const config = {
    authRequired: false,
    auth0Logout: true,
    secret: process.env.OIDC_SECRET,
    baseURL: process.env.OIDC_BASE_URL,
    clientID: process.env.OIDC_CLIENT_ID,
    issuerBaseURL: process.env.OIDC_ISSUER_BASE_URL
};

app.use(auth(config));
app.use(express.json());

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


https.createServer({
    key: fs.readFileSync('server.key'),
    cert: fs.readFileSync('server.cert')
}, app).listen(4010, () => {
    console.log("✅ Server running on https://localhost:4010");
});
  
