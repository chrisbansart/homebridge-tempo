# Homebridge Tempo

[![verified-by-homebridge](https://badgen.net/badge/homebridge/verified/purple)](https://github.com/homebridge/homebridge/wiki/Verified-Plugins)
[![npm](https://img.shields.io/npm/v/homebridge-tempo)](https://www.npmjs.com/package/homebridge-tempo)
[![npm](https://img.shields.io/npm/dt/homebridge-tempo)](https://www.npmjs.com/package/homebridge-tempo)

Le Plugin Homebridge Tempo permet d'intégrer les couleurs journalières du service Tempo de EDF-RTE dans HomeKit sous forme de "Détecteurs de Contact". Il permet de piloter sa consommation d'énergie et ses appareils connectés en fonction de la couleur du jour (tarif) et du lendemain, en particulier durant les heures pleines (entre 6h et 22h) des jours rouges.

Exemples d'automatisations dans l'app Maison pour limiter la consommation électrique les heures pleines des jours rouges :

- Le détecteur Jour Rouge HP (Heures Pleines) s'allume => Éteindre le cumulus & éteindre le chauffage de la chambre d'amis & Réduire le chauffage électrique des autres chambres & Arrêter la charge de la voiture électrique

Exemple d'automatisation pour anticiper un jour rouge le lendemain :

- Le détecteur J+1 Rouge s'allume => Envoyer une notification "Demain sera un jour rouge Tempo" & Lancer la charge complète de la voiture électrique cette nuit

Dans tous les cas lors du passage en heures creuses quelle que soit la couleur du jour :

- Lorsqu'il est 22h => Allumer le cumulus et régler tous les radiateurs électriques en mode standard & Démarrer la charge de la voiture électrique

## Fonctionnalités

- **Affiche la couleur du jour actuel (J)** (Rouge, Blanc, ou Bleu) et Heures Pleines / Heures Creuses en tant que "Détecteurs de contact" dans HomeKit : 6 détecteurs au total. Permet d'élaborer des scénarios tenant compte à la fois de la couleur du jour et du type de période horaire (HC ou HP).
- **Affiche la couleur du jour actuel (J) sans la distinction Heures Pleines / Heures Creuses** en tant que "Détecteurs de contact" dans HomeKit : 3 détecteurs au total. Permet d'élaborer des scénarios tenant compte uniquement de la couleur du jour.
- **Affiche la couleur du lendemain (J+1)** (Rouge, Blanc, ou Bleu) et Heures Pleines / Heures Creuses en tant que "Détecteurs de contact" dans HomeKit : 6 détecteurs au total. Permet d'anticiper et de préparer des automatisations pour le lendemain.
- **Affiche la couleur du lendemain (J+1) sans la distinction Heures Pleines / Heures Creuses** en tant que "Détecteurs de contact" dans HomeKit : 3 détecteurs au total. Permet d'anticiper simplement la couleur du lendemain.
- Mise à jour automatique des données Tempo à partir du site web de EDF-RTE Tempo.
- Possibilité de rendre visible ou pas certains détecteurs dans "Maison" afin de ne pas surcharger inutilement l'interface.
- Personnalisation des noms des détecteurs via la configuration.

## Installation

Via le moteur de recherche de plugin de Homebridge
ou
`npm i -g homebridge-tempo`

## Configuration du plugin

Les options de configuration disponibles sont :

### Détecteurs pour le jour actuel (J)

| Champ                                 | Description                                                                                 | Valeur par défaut |
| ------------------------------------- | ------------------------------------------------------------------------------------------- | ----------------- |
| `[ ] Jour Rouge HC`                   | Rend visible dans HomeKit le détecteur de contact pour les jours rouges aux Heures Creuses. | `true`            |
| `Nom de l'accessoire (Jour Rouge HC)` | Nom personnalisé pour le détecteur de contact des jours rouges Heures Creuses.              | `"J Rouge HC"`    |
| `[ ] Jour Rouge HP`                   | Rend visible dans HomeKit le détecteur de contact pour les jours rouges aux Heures Pleines. | `true`            |
| `Nom de l'accessoire (Jour Rouge HP)` | Nom personnalisé pour le détecteur de contact des jours rouges Heures Pleines.              | `"J Rouge HP"`    |
| `[ ] Jour Rouge`                      | Rend visible dans HomeKit le détecteur de contact pour les jours rouges.                    | `true`            |
| `Nom de l'accessoire (Jour Rouge)`    | Nom personnalisé pour le détecteur de contact des jours rouges.                             | `"J Rouge"`       |

etc pour les couleurs blanches et bleues

### Détecteurs pour le lendemain (J+1)

| Champ                                | Description                                                                                     | Valeur par défaut |
| ------------------------------------ | ----------------------------------------------------------------------------------------------- | ----------------- |
| `[ ] J+1 Rouge HC`                   | Rend visible dans HomeKit le détecteur de contact pour les jours rouges J+1 aux Heures Creuses. | `true`            |
| `Nom de l'accessoire (J+1 Rouge HC)` | Nom personnalisé pour le détecteur de contact des jours rouges J+1 Heures Creuses.              | `"J+1 Rouge HC"`  |
| `[ ] J+1 Rouge HP`                   | Rend visible dans HomeKit le détecteur de contact pour les jours rouges J+1 aux Heures Pleines. | `true`            |
| `Nom de l'accessoire (J+1 Rouge HP)` | Nom personnalisé pour le détecteur de contact des jours rouges J+1 Heures Pleines.              | `"J+1 Rouge HP"`  |
| `[ ] J+1 Rouge`                      | Rend visible dans HomeKit le détecteur de contact pour les jours rouges J+1.                    | `true`            |
| `Nom de l'accessoire (J+1 Rouge)`    | Nom personnalisé pour le détecteur de contact des jours rouges J+1.                             | `"J+1 Rouge"`     |

etc pour les couleurs blanches et bleues

## Fonctionnement de la mise à jour des données du plugin Tempo

Chronologie :

**Jour J :**

- À 6h30h, le site web d'EDF met à jour la couleur du jour J+1
- À 7h, le plugin Tempo récupère la couleur du jour J+1 depuis le site EDF. Si la récupération échoue, il réessaie 1 heure plus tard.
- **Dès que les données J+1 sont disponibles**, les détecteurs J+1 (J+1 Rouge, J+1 Blanc, J+1 Bleu, ainsi que leurs variantes HP/HC) s'activent ou se désactivent en fonction de la couleur annoncée pour le lendemain.

**Le lendemain J+1 (qui devient le nouveau J) :**

- À 6h (le moment où la nouvelle couleur et la tarification associée s'appliquent), les détecteurs de contact HomeKit représentant les couleurs du jour actuel s'activent ou se désactivent. Exemple : si le jour devient rouge, les détecteurs "Jour Rouge" et "Jour Rouge HP" s'activent et tous les autres détecteurs J se désactivent.
- À 22h (le moment du passage en Heures Creuses), le détecteur de la couleur du jour reste actif, le détecteur de la "couleur du jour HC" s'active et le détecteur "couleur du jour HP" se désactive. Exemple : si le jour est rouge, le détecteur "Jour Rouge" reste actif, le détecteur "Jour Rouge HC" s'active et le détecteur "Jour Rouge HP" se désactive.

**Détecteurs J+1 :**

- Les détecteurs J+1 HP/HC changent d'état aux mêmes heures (6h et 22h) que les détecteurs J, mais reflètent toujours la couleur du lendemain.
- Les détecteurs J+1 sans distinction HP/HC restent actifs en permanence selon la couleur annoncée pour le lendemain.

Cette stratégie de mise à jour des données évite d'avoir à solliciter à intervalles répétés le site Web EDF-RTE inutilement.

**NB :** Au démarrage ou lors d'un redémarrage du plugin, le plugin met à jour immédiatement tous les détecteurs (J et J+1) et récupère les données de la saison en cours.

## Cas d'usage des détecteurs J+1

Les détecteurs J+1 permettent d'anticiper la couleur du lendemain et de créer des automatisations préventives :

- **Notification** : "Envoyer une notification si demain est un jour rouge"
- **Charge anticipée** : "Lancer la charge complète de la voiture électrique en heures creuses si demain est rouge"
- **Préparation du logement** : "Préchauffer la maison cette nuit si demain est un jour bleu (tarif avantageux)"
- **Gestion de l'eau chaude** : "Chauffer le ballon d'eau chaude au maximum cette nuit si demain est rouge"

## Ressources

- [Site Web EDF donnant la couleur des jours Tempo](https://particulier.edf.fr/fr/accueil/gestion-contrat/options/tempo.html#/)
- [Homebridge](https://homebridge.io/)

## Support

Pour toute question ou problème, ouvrez une [issue](https://github.com/chrisbansart/homebridge-tempo/issues).

---

## Licence

ICS © 2025 [Christophe Bansart - KDetude](https://github.com/chrisbansart)
