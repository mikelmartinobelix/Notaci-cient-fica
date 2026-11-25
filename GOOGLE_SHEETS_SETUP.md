# Connexió amb Google Sheets (Google Apps Script)

Guia pas a pas per recollir automàticament la participació i puntuacions de l'alumnat en un full de càlcul del teu Google Drive.

## Pas 1: Crear el full de càlcul

1. Obre [Google Drive](https://drive.google.com) i crea un **Full de càlcul de Google** nou (per exemple, anomenat `Participació Notació Científica`).
2. Al menú superior del full, clica **Extensions → Apps Script**.

## Pas 2: Enganxar el codi de l'Apps Script

Esborraràs el codi per defecte (`function myFunction()...`) i hi enganxaràs aquest codi complet:

```javascript
function doPost(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();

    // Crea les capçaleres automàticament si el full és buit
    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        'Data i hora',
        'Nom i cognoms',
        'Grup',
        'Tipologia',
        'Nivell',
        'Exercicis resolts',
        'Encerts',
        'Precisió (%)',
        'Millor ratxa',
        'Estat'
      ]);
      sheet.getRange(1, 1, 1, 10).setFontWeight('bold');
      sheet.setFrozenRows(1);
    }

    var raw = e && e.postData && e.postData.contents ? e.postData.contents : '{}';
    var data = JSON.parse(raw);

    // Validació bàsica de camps
    var nom = String(data.nom || '').trim().slice(0, 100);
    if (!nom) {
      return ContentService
        .createTextOutput(JSON.stringify({ ok: false, error: 'Falta el nom' }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    sheet.appendRow([
      new Date(),
      nom,
      String(data.grup || '').trim().slice(0, 40),
      String(data.tipologia || '').trim().slice(0, 60),
      String(data.nivell || '').trim().slice(0, 40),
      Number(data.resolts) || 0,
      Number(data.encerts) || 0,
      Number(data.precisio) || 0,
      Number(data.ratxa) || 0,
      String(data.estat || '').trim().slice(0, 40)
    ]);

    return ContentService
      .createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: String(err) }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
```

Clica la icona de **Desar** (disquet o `Ctrl+S` / `Cmd+S`).

## Pas 3: Publicar-lo com a aplicació web

1. A dalt a la dreta d'Apps Script, clica **Implementa → Nova implementació** (en anglès: *Deploy → New deployment*).
2. A la icona d'engranatge (**Selecciona el tipus**), tria **Aplicació web** (*Web app*).
3. Configura els camps així:
   - **Descripció**: `Registre Notació 10`
   - **Executa com a**: `Jo` (*Me*)
   - **Qui hi té accés**: `Qualsevol persona` (*Anyone*) *(imprescindible perquè el navegador de l'alumnat hi pugui enviar dades sense iniciar sessió amb compte Google)*.
4. Clica **Implementa**.
5. La primera vegada Google et demanarà autoritzar permisos:
   - Clica **Autoritza l'accés** i tria el teu compte.
   - Si surt l'avís *"Google no ha verificat aquesta aplicació"*, clica **Opcions avançades → Ves a [nom del projecte] (no segur) → Permet**.
6. Copia l'**URL de l'aplicació web** (acaba en `/exec`).

## Pas 4: Connectar l'URL amb la teva web a GitHub Pages

Tria **una** d'aquestes dues maneres (la que et sigui més còmoda):

### Opció A: Enganxar l'URL al fitxer `src/config/sheets.ts`
Obre `src/config/sheets.ts` al teu repositori de GitHub (icona del llapis) i deixa-hi l'URL copiada:

```ts
export const SHEETS_WEBHOOK_URL =
  import.meta.env.VITE_SHEETS_WEBHOOK_URL ||
  'https://script.google.com/macros/s/EL_TEU_ID/exec';
```

Desa els canvis (`Commit changes`) i GitHub Pages tornarà a publicar la web automàticament.

### Opció B: Variable de repositori a GitHub
1. Al teu repositori de GitHub, ves a **Settings → Secrets and variables → Actions → Variables**.
2. Clica **New repository variable**.
3. Nom: `SHEETS_WEBHOOK_URL` — Valor: l'URL que acaba en `/exec`.
4. Torna a executar el flux des de **Actions → Publicar a GitHub Pages → Run workflow**.

---

A partir d'aquell moment, cada vegada que un alumne entri (posant nom, grup i contrasenya `Macitec3`) i completi una sèrie de 10 exercicis —o premi **Enviar progrés al professorat**—, apareixerà una fila nova al teu Google Sheet!
