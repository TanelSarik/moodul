# Paigaldusjuhend

## Vajalik tarkvara

- Node.js 22 või uuem
- npm
- Veebibrauser

SQLite andmebaasi eraldi paigaldada ei ole vaja, sest rakendus kasutab Node'i `better-sqlite3` paketti ja loob andmebaasifaili automaatselt.

## Seadistamine

1. Paigalda paketid:

```bash
npm install
```

2. Loo keskkonnamuutujate fail:

```bash
cp .env.example .env
```

Windows PowerShellis:

```powershell
Copy-Item .env.example .env
```

3. Muuda `.env` failis väärtused ära. `SESSION_SECRET` peab olema vähemalt 32 juhuslikku märki. `ADMIN_PASSWORD` peab olema vähemalt 8 märki. Lokaalselt `http://localhost:3000` aadressil jäta `COOKIE_SECURE=false`; pane see `true` ainult siis, kui rakendus töötab HTTPS-i taga.

4. Loo andmebaasi struktuur:

```bash
npm run migrate
```

5. Lisa näidisroad:

```bash
npm run seed
```

6. Loo või uuenda admin kasutaja. Parool salvestatakse andmebaasi bcrypt räsina:

```bash
npm run create-admin
```

7. Käivita backend:

```bash
npm start
```

Rakendus avaneb aadressil `http://localhost:3000`. Admini sisselogimine on `http://localhost:3000/admin/login`.

## Andmebaas

Migratsioon asub failis `db/migrations/001_init.sql`. See loob tabelid:

- `admins`
- `dishes`
- `contact_messages`
- `migrations`

Andmebaasi dumpi saab SQLite failist teha käsuga:

```bash
sqlite3 db/midnight-ramen.sqlite .dump > db/dump.sql
```

## Turvalisus

- Admini paroolid räsitakse `bcryptjs` paketiga.
- Kõik SQL päringud kasutavad ettevalmistatud lauseid ja parameetreid.
- Kontaktvorm, login ja admini roa vormid valideeritakse serveris.
- Kõik POST vormid kasutavad sessioonipõhist CSRF tokenit.
- `.env` on `.gitignore` failis ja päris saladusi koodi ei panda.
