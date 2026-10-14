# Loka — Annulation client sécurisée et détail réservation V6

## Règle métier

Le client peut demander l'annulation depuis le détail uniquement pour une réservation dont il est propriétaire, encore en attente ou confirmée, et avant la date/heure prévue. L'action est atomique et revérifie l'état en base au moment de l'écriture.

Les paiements approuvés ne sont pas annulés automatiquement et ne sont pas présentés comme remboursés. Le client est orienté vers le support pour examen de l'annulation et des conditions d'un éventuel remboursement. Un paiement encore en attente ou à l'état incertain bloque l'annulation en ligne afin d'éviter une course entre le webhook et l'action client. Les réservations commencées, terminées, annulées ou expirées ne sont pas annulables par cette route.

Routes authentifiées :
- `POST /api/reservations/:id/annuler`
- `POST /api/restaurants/reservations/:id/annuler`

L'API vérifie la propriété côté serveur. Une mise à jour conditionnelle évite qu'une action basée sur un état obsolète écrase une transition concurrente. Pour une réservation restaurant, la table est remise à `disponible` après succès.

## Disponibilité des sources sur le détail

Si aucune réservation n'est trouvée et qu'une ou plusieurs API ont échoué, l'interface nomme la/les source(s) indisponible(s) et demande de réessayer. Elle ne transforme pas une panne partielle en conclusion « réservation introuvable ».

## Limites explicites

La politique commerciale d'annulation et de remboursement d'une réservation déjà payée n'est pas définie précisément dans le document maître consulté. En conséquence, cette passe ne décide pas d'une pénalité, ne déclenche pas de remboursement et ne change pas le statut financier. Le traitement de remboursement après examen reste distinct et doit être défini/validé avant automatisation.
