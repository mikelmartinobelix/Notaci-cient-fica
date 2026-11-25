# Notació 10 — Publicació a GitHub Pages

Aplicació educativa per practicar la notació científica per nivells, preparada per publicar-se directament a **GitHub Pages** amb accés protegit per contrasenya.

## Com publicar-la a GitHub Pages

1. Crea un repositori nou a GitHub (per exemple, `notacio-cientifica`).
2. Puja tots els fitxers d'aquest projecte a la branca `main` (o `master`), **inclosa la carpeta `.github/workflows/deploy-pages.yml`**.
3. A GitHub, ves a **Settings → Pages** i, a **Build and deployment → Source**, selecciona **GitHub Actions**.
4. A la pestanya **Actions**, veuràs el flux **Publicar a GitHub Pages**. Quan acabi, tindràs l'enllaç públic llest per compartir amb l'alumnat:
   `https://<el-teu-usuari>.github.io/<nom-del-repositori>/`

## Si el flux automàtic no s'executa

Revisa aquests 3 punts habituals a GitHub:

1. **Comprova que el fitxer del flux s'ha pujat al repositori**: si has pujat els fitxers arrossegant-los des del navegador, el sistema operatiu sovint amaga la carpeta `.github`. Comprova a GitHub que veus `.github/workflows/deploy-pages.yml`. Si no hi és, clica **Add file → Create new file** a GitHub, escriu `.github/workflows/deploy-pages.yml` com a nom i enganxa-hi el contingut d'aquest fitxer.
2. **Activa GitHub Actions si cal**: ves a **Settings → Actions → General** i assegura't que està marcada l'opció **Allow all actions and reusable workflows**.
3. **Executa'l manualment un cop**: a la pestanya **Actions → Publicar a GitHub Pages**, clica **Run workflow**.

## Accés de l'alumnat

- La contrasenya actual d'accés és `Macitec3`, verificada mitjançant resum SHA-256 al navegador perquè no aparegui en text pla dins del codi.
- L'estat de desbloqueig es manté en memòria durant la sessió i el progrés d'exercicis de cada alumne es desa localment al seu navegador.
