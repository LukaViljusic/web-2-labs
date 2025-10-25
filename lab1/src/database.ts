import dotenv from 'dotenv'
import { Pool } from 'pg'

dotenv.config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: 'Web2-LotoAppDB',
    password: process.env.DB_PASSWORD,
    ports: 5432,
    ssl: false
});

export async function getLastRoundId() {
    try {
        const result = await pool.query('SELECT * FROM rounds ORDER BY id DESC LIMIT 1');

        if (result.rows.length === 0) return 0;

        return result.rows[0].id;
    } catch(err) {
        console.error('Greška pri dohvatu podataka o rundi:', err);
        throw err;
    }
}

export async function insertTicket(auth0Id: string, idNumber: string, lotoNumbers: number[]) {
    const roundId = await getOpenRoundId();
    if(roundId === 0)
        return null;

    try {
        const result = await pool.query(
            `INSERT INTO tickets (auth0id, round_id, id_number, numbers) 
             VALUES ($1, $2, $3, $4) RETURNING *`,
            [auth0Id, roundId, idNumber, lotoNumbers]
        );
        return result.rows[0].id;
    } catch (err) {
        console.error('Greška pri unosu tiketa:', err);
        throw err;
    }
}

export async function getOpenRoundId() {
    try {
        const result = await pool.query('SELECT * FROM rounds ORDER BY id DESC LIMIT 1');

        if (result.rows.length === 0) return 0;
        if(result.rows[0].active)
            return result.rows[0].id;

        return 0;
    } catch(err) {
        console.error('Greška pri dohvatu podataka o rundi:', err);
        throw err;
    }
}

export async function getLotoNumbersById(uuid: string) {
    try {
        const result = await pool.query(
            "SELECT numbers, round_id FROM tickets WHERE id = $1",
            [uuid]
        );

        if (result.rows.length === 0) return null;

        return {
            numbers: result.rows[0].numbers,
            round_id: result.rows[0].round_id
        };

    } catch(err) {
        console.error('Greška pri dohvaćanju izabranih brojeva:', err);
        throw err;
    }
}

async function getOpenRound() {
    try {
        const result = await pool.query('SELECT * FROM rounds ORDER BY id DESC LIMIT 1');
        return result.rows[0].active;
    } catch(err) {
        console.error('Greška pri dohvatu podataka o rundi:', err);
        throw err;
    }
}

export async function openNewRound() {
    try {
        const isOpen = await getOpenRound();
        if(isOpen)
            return false;

        const result = await pool.query(`INSERT INTO rounds (active) 
             VALUES ($1) RETURNING *`,
            ['true']);

        return true;
    } catch(err) {
        console.error('Greška pri umetanju nove runde:', err);
        throw err;
    }
}

export async function insertResultNumbersManual(roundId: number, numbers: number[]) {
    try {
        const result = await pool.query(`INSERT INTO results(round_id, numbers) 
            VALUES ($1, $2)`,
            [roundId, numbers])
    } catch(err) {
        console.error('Greška pri izvlačenju rezultata:', err);
        throw err;
    }
}

export async function closeRound() {
    const roundId = await getOpenRoundId();
    if(roundId === 0)
        return false;

    try {
        const result = await pool.query(`UPDATE rounds SET active = ($1) WHERE id = ($2)`,
            ['false', roundId]);

        return true;
    } catch(err) {
        console.error('Greška pri zatvaranju kola:', err);
        throw err;
    }
}

export async function getResultByRoundId(roundId) {
    try {
        
        const result = await pool.query(`SELECT * FROM results WHERE round_id = ($1)`,
            [roundId]);
        
        if (result === undefined || result.rows[0] === undefined 
            || result.rows[0].numbers === undefined) return null;

        return result.rows[0].numbers;
    } catch(err) {
        console.error('Greška pri umetanju nove runde:', err);
        throw err;
    }
}

export async function getTicketsCount() {
    try {
        const roundId = await getOpenRoundId();
        if(roundId === 0) return;
        
        const result = await pool.query(`SELECT COUNT(*) as ticketCount FROM tickets where round_id = ($1)`,
            [roundId]
        )

        if(result === undefined) return;

        return result.rows[0].ticketcount;
    } catch(err) {
        console.error('Greška pri umetanju nove runde:', err);
        throw err;
    }
}