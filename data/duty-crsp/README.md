# Duty calculator CRSP catalog

This folder holds **CSV files** for the `/duty` import tax calculator. You do not need an Excel export from KRA to start: edit the CSV in Google Sheets, Numbers, or any text editor, then import.

## Quick start

```bash
# Import the starter catalog (~100 popular Kenya imports)
npm run db:import-crsp

# Import your own file
npm run db:import-crsp -- data/duty-crsp/my-rows.csv
```

Or use **Admin → Duty CRSP** to upload CSV in the browser.

## Column reference

| Column     | Required | Example        | Notes                                      |
|------------|----------|----------------|--------------------------------------------|
| make       | yes      | Toyota         |                                            |
| model      | yes      | Prado          |                                            |
| trim       | no       | TX             | Variant / grade                            |
| year       | yes      | 2018           | Model year                                 |
| engineCC   | yes      | 2800           | Engine capacity in cc                      |
| fuelType   | yes      | DIESEL         | PETROL, DIESEL, HYBRID, ELECTRIC, LPG      |
| bodyType   | no       | SUV            | SEDAN, SUV, HATCHBACK, PICKUP, WAGON, MPV… |
| crspKes    | yes      | 5400000        | KRA CRSP in KES (commas OK)                |
| notes      | no       | Verify with KRA | Internal note                             |

## Getting official values later

When you obtain KRA’s **Customs Reference Survey Price** schedule (PDF/Excel from KRA or your clearing agent):

1. Copy rows into this CSV format (one row per make/model/trim/year/CC).
2. Re-run `npm run db:import-crsp` or admin upload (upserts by slug, safe to re-run).

## Files

- `starter-catalog.csv` — seed data for popular imports (illustrative CRSP; replace with official figures when available).
