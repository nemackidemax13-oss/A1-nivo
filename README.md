# DE-MAX A1 – zaštićeni portal za učenike

Ovo je Replit-ready Node/Express aplikacija napravljena za DE-MAX A1.

## Šta radi
- prijava učenika korisničkim imenom i lozinkom
- sadržaj i vežbe se ne otvaraju bez prijave
- učenik u adresnoj liniji vidi samo tvoj Replit portal, npr. `/materijal/lekcija7`
- originalni GitHub URL se preuzima na serveru i ne šalje se kao direktan link učeniku
- admin panel za dodavanje, uključivanje/isključivanje i promenu lozinki učenika
- spremno za oko 80 učenika kao početna verzija
- mobilni dizajn u stilu DE-MAX / Jotform aplikacije

## Probni nalozi
ADMIN:
- korisničko ime: `admin`
- lozinka: `PromeniMe123!`

UČENIK:
- korisničko ime: `ucenik1`
- lozinka: `DemaxA1!`

**Obavezno promeni administratorsku lozinku pre objave.**

## Replit
1. Napravi novi Node.js Repl/App.
2. Uploaduj sve fajlove iz ovog ZIP-a.
3. U Replit Secrets dodaj:
   - `SESSION_SECRET` = dugačak nasumičan tajni tekst
4. Pokreni:
   `npm install`
5. Zatim:
   `npm start`
6. Publish/Deploy aplikaciju.

## Materijali
Portal trenutno povlači tvoje postojeće HTML vežbe iz GitHub repozitorijuma:
`nemackidemax13-oss/A1-nivo`

Vežbe su dostupne samo preko zaštićenih ruta portala.

## Važno za 80 učenika
Ova verzija čuva korisnike u `data/users.json`. To je dobro za probu i manji privatni portal.
Za dugoročnu produkciju na Replit Autoscale-u preporučuje se prebacivanje učenika na PostgreSQL/Replit bazu, jer fajl-sistem deploymenta nije idealan kao trajna baza.

## Ograničenje zaštite
Ovo sprečava da običan direktan URL materijala radi bez prijave. Ne postoji način da se potpuno spreči prijavljen učenik da napravi screenshot, snimi ekran ili podeli svoju lozinku.
