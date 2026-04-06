# Djur i Juni

En React/Vite-app för daglig hälsologgning med fokus på rytm, trend och enkel uppföljning.

## Kom igång

### 1. Klona projektet

```bash
git clone https://github.com/VanDree1/lean-app.git
cd lean-app
```

### 2. Installera beroenden

```bash
npm install
```

### 3. Starta utvecklingsservern

```bash
npm run dev
```

Öppna sedan adressen som visas i terminalen, normalt:

`http://localhost:5173/`

## Krav

- Node.js 20+ rekommenderas
- npm 10+ rekommenderas

Kontrollera versioner:

```bash
node -v
npm -v
```

## Vanliga kommandon

Starta appen lokalt:

```bash
npm run dev
```

Bygg för produktion:

```bash
npm run build
```

Förhandsvisa produktionsbygget:

```bash
npm run preview
```

Kör lint:

```bash
npm run lint
```

## Om något inte startar

Om `localhost:5173` inte öppnas:

1. Kontrollera att `npm run dev` fortfarande kör i terminalen.
2. Testa att ladda om sidan.
3. Kontrollera att inga fel visas i terminalen.

Om beroenden saknas eller installationen avbryts:

```bash
rm -rf node_modules package-lock.json
npm install
```

## Projektstruktur

- `src/pages` – appens huvudsidor
- `src/components` – UI-komponenter
- `src/store` – global state och localStorage-synk
- `src/hooks` – logik för tone, insights, profil m.m.

## Delning

För att någon annan ska kunna köra appen räcker det att de:

1. laddar ner eller klonar repot från GitHub
2. kör `npm install`
3. kör `npm run dev`

Ingen separat backend eller databas krävs för lokal körning.
