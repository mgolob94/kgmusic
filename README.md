# KG Music – evidenca ur za učiteljico klavirja in petja

PWA (Next.js 16, App Router, TypeScript strict, Tailwind 4, Postgres + Drizzle). Več šol (workspace), vsaka s svojimi učenci in urnikom, tedensko ponavljajoči termini, koledar, evidenca prisotnosti in mesečni izvoz v Excel/PDF.

## Zagon lokalno

```bash
cp .env.example .env.local        # COOKIE_SECURE=false za http
docker compose up db -d           # ali lasten Postgres; DATABASE_URL v .env.local
npm install
npm run db:migrate                # migracije + račun iz ADMIN_EMAIL/ADMIN_PASSWORD
npm run dev
```

## Namestitev na Hetzner (Docker)

```bash
git clone <repo> && cd kgmusic
cp .env.example .env              # nastavi POSTGRES_PASSWORD, SESSION_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD
docker compose up -d --build      # migracije se zaženejo samodejno ob zagonu
```

Aplikacija posluša samo na `127.0.0.1:3000`. Javno jo izpostavi nginx s HTTPS (`deploy/nginx.conf.example`, nato `certbot --nginx`). PWA in prijava sta brez HTTPS neuporabni (`COOKIE_SECURE=true`).
Varnostna kopija: `docker compose exec db pg_dump -U kgmusic kgmusic > backup.sql` (nastavi cron, shrani ven s strežnika).

## Kaj je v aplikaciji

- **Šole**: poljubno število, preklop v stranski vrstici/zgornji vrstici; sezona (privzeto sept–jun) določa privzeto obdobje serij.
- **Učenci**: ime, priimek, letnica, telefon, kontakt staršev, opombe, GDPR privolitev (z datumom), arhiv in trajen izbris (vpis imena).
- **Tedenski termini**: dan, ura, trajanje, predmet, od–do. Ustvarijo posamezne ure; državni prazniki se po želji preskočijo. Konec serije je prilagodljiv (podaljšaj do avgusta, skrajšaj; zabeležene ure ostanejo).
- **Koledar**: dan / teden / mesec / seznam (seznam privzeto na telefonu), filter po predmetu in učencu, povleci za premik (namizje), klik na prazno polje doda uro, črta »zdaj«, prekrivanja (tudi med šolama).
- **Prisotnost**: opravljeno, opravičen, neopravičen izostanek, odpadlo; z enim dotikom, vedno z razveljavitvijo.
- **Izvoz**: mesečni povzetek + seznam ur v `.xlsx` (formule) in `.pdf`. Obračun (cene) je namenoma še izpuščen.

## Predpostavke

- Ena učiteljica; prijava z e-naslovom in geslom (bcrypt, podpisano sejno piškotek, omejitev poskusov). Tabela `users` je pripravljena za več računov.
- Postgres namesto Mongo: relacijski podatki (učenec ↔ serija ↔ ura) in izvozi so naravno SQL; ostaja v istem compose.
- Datumi in ure so lokalni nizi (`YYYY-MM-DD`, `HH:MM`, čas Europe/Ljubljana), zato poletni čas ne zamika ur.
- Izvoz šteje kot »opravljeno« samo status *opravljeno*. Pravilo za obračun (npr. neopravičen izostanek se zaračuna) pride kasneje.

## Oblikovalska zasnova (kratko)

- **Smer**: moderna papirnica za glasbenico. Hladen papir (`#f3f5f1`), črnilo, ena samozavestna petrolejska barva (kot lak klavirja); statusi in predmeti imajo barvo *in* ikono.
- **Tipografija**: Fraunces za naslove, Figtree za vmesnik (self-hosted prek fontsource, deluje brez omrežja do Googla); šumniki preverjeni.
- **Edini poudarek**: panel »Danes« s črtovjem in »playheadom« za trenutni čas; vse ostalo je tiho.
- **Gibanje**: samo odziv na dejanja (sheet, toast) in mehek utrip »zdaj«; `prefers-reduced-motion` upoštevan. Svetla + temna tema.
- **UX**: danes-prvo, cilji dotika ≥ 44 px, spodnja navigacija na telefonu, razveljavi (toast) namesto potrditvenih oken (potrditev z vpisom imena samo za trajne izbrise).
- Tokeni so v `src/app/globals.css` (CSS spremenljivke → Tailwind teme); barv zunaj tokenov ni (razen izbirnika barv šole).

## Robni primeri

- **Poletni čas**: nobena ura ni shranjena kot UTC; »zdaj« se računa v Europe/Ljubljana ne glede na napravo.
- **Prekrivanja**: opozorilo ob ustvarjanju/premiku (tudi v drugi šoli); ne blokira.
- **Dolga imena**: skrajšana z elipso, polno ime v `aria-label`.
- **Prazen teden/mesec/šola**: prijazna prazna stanja z gumbom; vsak seznam ima skeleton in error stanje.
- **Premik ure iz serije**: spremeni samo to uro; ob podaljšanju serije se premaknjena/odpadla ura ne ustvari znova (unikatni indeks serija+datum).
- **Skrajšanje serije**: odstrani samo nezabeležene ure po novem koncu.
- **Offline**: service worker namenoma ne predpomni strani z osebnimi podatki (GDPR); offline dobiš obvestilo. Pisanje brez povezave še ni podprto.
- **Praznik na dan ure**: preskočeno pri ustvarjanju (stikalo); šolske počitnice se ne preskakujejo (odpadle ure označi ročno).
- **Seja**: poteče po 30 dneh; ob poteku akcija vrne prijazno napako.

## Naslednji koraki

1. **Obračun**: cena na šolo/učenca, pravila za izostanke, vsota v izvozu.
2. **Počitnice**: seznam šolskih počitnic na šolo, množično »odpadlo« za obdobje.
3. **Spremeni serijo od datuma**: nov dan/ura od izbranega tedna naprej.
4. **Obvestila**: opomnik pred uro/nepotrjene ure (Web Push), e-pošta staršem.
5. **Varnost**: 2FA, več uporabnikov, avtomatska varnostna kopija, revizijski dnevnik za GDPR.
6. **Supabase**: ostalo je v `src/db/queries.ts` in `src/app/actions/*`; če želiš preselitev, se menja samo ta sloj.
