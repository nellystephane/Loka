# Installation et build du frontend Loka

Le précédent `package-lock.json` était incomplet (il ne contenait pas les résolutions des paquets). Il a été retiré au lieu d'être conservé comme s'il était valide. Les dépendances directes sont épinglées dans `package.json`.

Depuis ce dossier `client/`, dans un environnement autorisé à accéder au registre npm :

```bash
npm install
npm run build
```

`npm install` doit produire un nouveau `package-lock.json`. Conserver ce fichier généré dans le dépôt afin que les installations futures soient reproductibles. Le build est valide uniquement si `npm run build` termine avec le code de sortie 0. La transpilation syntaxique des fichiers TS/TSX effectuée lors de l'audit ne remplace pas ce build.
