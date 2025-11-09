import express from 'express'
import path from 'path';
import { attempsRemaining, getUsers, login } from './database'
import bcrypt from 'bcrypt'
import cookieParser from 'cookie-parser'
import dotenv from 'dotenv'

dotenv.config();
const app = express();
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "pug");

app.use(express.json());
app.use(cookieParser());

const externalUrl = process.env.RENDER_EXTERNAL_URL;
const port = process.env.PORT ? parseInt(process.env.PORT) : 4010;
const hostname = externalUrl ? '0.0.0.0' : '127.0.0.1';
const sessions: Record<string, { username: string, created: number }> = {};
const loginDelays = {};

app.get("/", function (req, res) {
    res.render("index");
});

app.get("/sql", function (req, res) {
    res.render("sql");
});

app.get("/auth", function (req, res) {
    const sid = req.cookies['sessionId'];
    const session = sid && sessions[sid] ? sessions[sid] : null;

    res.render("auth", { loggedIn: !!session, username: session ? session.username : null })
});

app.post("/get-users", async (req, res) => {
    try {
        const { username, isChecked } = req.body;
        const result = await getUsers(username, isChecked);
        res.json({
            result: result
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post("/login", async (req, res) => {
    const { username, password, isChecked } = req.body;

    let user;
    try {
        user = await login(username, password);
    } catch (err) {
        console.error('DB error:', err);
        return res.status(500).json({ error: 'Server error' });
    }


    if (!isChecked) {
        if (user === null) {
            return res.status(400).json({ message: 'Incorrect username!' });
        }

        if (user.password !== password) {
            return res.status(400).json({ message: 'Incorrect password!' });
        }

        const usernamePart = username.split('@')[0];
        const sessionId = `session_${usernamePart}_${Date.now()}`;

        res.cookie('sessionId', sessionId, {
            httpOnly: false,
            secure: false,
            sameSite: 'lax',
            maxAge: 3600000
        });

        sessions[sessionId] = { username, created: Date.now() };

        return res.status(200).end('Login successfull');
    } else {
        if (user === null) {
            return res.status(400).json({ message: `Couldn't found your account.` })
        }

        console.log(user);
        
        if (user.attempsremaining <= 1) {
            return res.status(400).json({ message: `Your account is blocked, contact administrator!` })
        }

        const now = Date.now();
        const delayData = loginDelays[username] || { failedCount: 0, nextAllowedTime: 0};

        if(delayData.nextAllowedTime > now) {
            const waitSeconds = Math.ceil((delayData.nextAllowedTime - now) / 1000);
            return res.status(429).json({ message: `Please wait ${waitSeconds}s before next login attempt.` });
        }
        const isCorrectPassword = await bcrypt.compare(password, user.password);

        console.log(isCorrectPassword);
        

        if(!isCorrectPassword) {
            try {
                console.log(user.id, user.attempsremaining);
                user = await attempsRemaining(user.id, user.attempsremaining-1);
            } catch(err) {
                return res.status(500).json({ error: 'Server error' });
            }

            delayData.failedCount++;

            if(delayData.failedCount >= 3) {
                const baseDelay = 5000;
                const multiplier = Math.pow(2, delayData.failedCount - 3); // eksponencijalni rast
                const waitTime = baseDelay * multiplier;
                delayData.nextAllowedTime = now + waitTime;
            }

            loginDelays[username] = delayData;

            return res.status(400).json({ message: `Couldn't found your account. ${user.attempsremaining} attempts left.` })
        }

        if(user.attempsremaining < 10) {
            user = await attempsRemaining(user.id, 10);
        }

        loginDelays[username] = { failedCount: 0, nextAllowedTime: 0 };

        const secureId = crypto.randomUUID();
        console.log(secureId);

        sessions[secureId] = { username, created: Date.now() };

        res.cookie('sessionId', secureId, {
            httpOnly: true,
            secure: false,
            sameSite: 'strict',
            maxAge: 3600000
        })

        return res.status(200).end('Login successfull');
    }

});

app.post('/logout', (req, res) => {
    const sid = req.cookies['sessionId'];

    if (sid && sessions[sid]) {
        console.log(`Logging out session: ${sid}`);
        delete sessions[sid];
    }

    res.clearCookie('sessionId', {
        httpOnly: true,
        secure: false,
        sameSite: 'strict'
    });

    return res.status(200).json({ message: 'Successfully logged out' });
});


app.get('/profile-attack', (req, res) => {
    const sid = req.query.cookie as string;
    console.log(sid);
    if (!sid || !sessions[sid]) {
        return res.status(401).end("Unauthorized");
    }

    return res.render('profile', { username: sessions[sid].username });
});

app.get('/profile', (req, res) => {
    const sid = req.cookies.sessionId;
    console.log('SessionId:', sid);

    if (!sid || !sessions[sid]) {
        return res.status(401).end("Unauthorized");
    }

    return res.render('profile', { username: sessions[sid].username });
});


app.listen(port, hostname, () => {
      console.log(`Server running on http://${hostname}:${port}/ and accessible externally at ${externalUrl}`);
  });