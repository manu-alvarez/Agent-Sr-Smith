# doctor

Ejecuta:

```bash
node --experimental-strip-types scripts/doctor.ts
```

Resume el JSON: `status`, `mode`, `profileId`, `agents`, `referenceProvider`, `networkProvidersEnabled` y cada entrada de `checks`. Si `status` no es `ok`, el comando sale con código distinto de cero. No rellenes un check que falte.
