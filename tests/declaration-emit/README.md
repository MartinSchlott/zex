# TS2742 Declaration Emit Test

Dieses Verzeichnis enthält Tests zur Reproduktion und Verifikation des TS2742-Problems.

## Problem

Wenn TypeScript `declaration: true` aktiviert ist und Zex-Schemas exportiert werden, kann TS2742 auftreten:

> TS2742: The inferred type of 'XSchema' cannot be named without a reference to `@ai-inquisitor/zex/dist/zex/complex-types/type-helpers.js`. This is likely not portable. A type annotation is necessary.

## Test-Dateien

### `exported-schemas.ts`
Enthält exportierte Schemas **ohne** explizite Typ-Annotationen. Diese sollten TS2742 auslösen, wenn das Problem noch besteht.

### `exported-schemas-with-annotation.ts`
Enthält exportierte Schemas **mit** `ZexTypeAny` Annotationen. Diese sollten kompilieren, aber `discriminatedUnion` sollte trotzdem funktionieren (nach dem Fix).

### `consumer-simulation.ts`
Simuliert ein Consumer-Projekt, das die exportierten Schemas importiert und weiter exportiert.

## Ausführen der Tests

```bash
# Kompilieren mit declaration: true
npm run declaration-emit:test

# Aufräumen
npm run declaration-emit:clean
```

## Erwartetes Verhalten

### Vor dem Fix:
- `exported-schemas.ts` sollte TS2742 Fehler produzieren
- `exported-schemas-with-annotation.ts` sollte kompilieren, aber `discriminatedUnion` sollte fehlschlagen

### Nach dem Fix:
- `exported-schemas.ts` sollte **ohne** TS2742 kompilieren
- `exported-schemas-with-annotation.ts` sollte kompilieren **und** `discriminatedUnion` sollte funktionieren
- Generierte `.d.ts` Dateien sollten keine internen `type-helpers` Referenzen enthalten

## Aktueller Status

Die Tests zeigen:
- ✅ `.d.ts` Dateien werden generiert
- ⚠️  Typen verwenden tiefe Import-Pfade (z.B. `../../src/zex/index.js`)
- ❓ TS2742 tritt möglicherweise erst auf, wenn ein Consumer-Projekt die generierten `.d.ts` verwendet

Um das Problem vollständig zu reproduzieren, müsste ein separates Consumer-Projekt erstellt werden, das die kompilierten Zex-Schemas importiert.
