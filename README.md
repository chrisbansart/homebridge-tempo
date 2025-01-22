# Homebridge Tempo

[![verified-by-homebridge](https://badgen.net/badge/homebridge/verified/purple)](https://github.com/homebridge/homebridge/wiki/Verified-Plugins)
[![npm](https://img.shields.io/npm/v/homebridge-tempo)](https://www.npmjs.com/package/homebridge-tempo)
[![npm](https://img.shields.io/npm/dt/homebridge-tempo)](https://www.npmjs.com/package/homebridge-tempo)

Le Plugin Homebridge Tempo permet d'intégrer les couleurs journalières du service Tempo de EDF-RTE dans HomeKit sous forme de "Détecteurs de Contact". Il permet de piloter sa consommation d'énergie et ses appareils connectés en fonction de la couleur du jour (tarif), en particulier durant les heures pleines (entre 6h et 22h) des jours rouges.

Exemples d'automatisations dans l'app Maison pour limiter la consommation électrique les heures pleines des jours rouges :

- Le détecteur Jour Rouge HP (Heures Pleines) s'allume => Eteindre le cumulus & éteindre le chauffage de la chambre d'amis & Réduire le chauffage électrique des autres chambres & Arrêter la charge de la voiture électrique

Dans tous les cas lors du passage en heures creuses quelle que soit la couleur du jour :

- Lorsqu’il est 22h => Allumer le cumulus et régler tous les radiateurs électriques en mode standard & Démarrer la charge de la voiture électrique

## Fonctionnalités

- Affiche la couleur du jour (Rouge, Blanc, ou Bleu) et Heures Pleines / Heures Creuses en tant que "Détecteurs de contact" dans HomeKit : 6 détecteurs au total. Permet d'élaborer des scénarios tenant compte à la fois de la couleur du jour et du type de période horaire (HC ou HP).
- Affiche la couleur du jour **sans la distinction Heures Pleines / Heures Creuses** en tant que "Détecteurs de contact" dans HomeKit : 3 détecteurs au total. Permet d'élaborer des scénarios tenant compte uniquement de la couleur du jour.
- Mise à jour automatique des données Tempo à partir du site web de EDF-RTE Tempo.
- Possibilité de rendre visible ou pas certains détecteurs dans "Maison" afin de ne pas surcharger inutilement l'interface.
- Personnalisation des noms des détecteurs via la configuration.

## Installation

Via le moteur de recherche de plugin de Homebridge
ou
`npm i -g homebridge-tempo`

## Configuration du plugin

Les options de configuration disponibles sont :

| Champ                                 | Description                                                                                 | Valeur par défaut |
| ------------------------------------- | ------------------------------------------------------------------------------------------- | ----------------- |
| `[ ] Jour Rouge HC`                   | Rend visible dans HomeKit le détecteur de contact pour les jours rouges aux Heures Creuses. | `true`            |
| `Nom de l'accessoire (Jour Rouge HC)` | Nom personnalisé pour le détecteur de contact des jours rouges Heures Creuses.              | `"J Rouge HC"`    |
| `[ ] Jour Rouge HP`                   | Rend visible dans HomeKit le détecteur de contact pour les jours rouges aux Heures Pleines. | `true`            |
| `Nom de l'accessoire (Jour Rouge HP)` | Nom personnalisé pour le détecteur de contact des jours rouges Heures Pleines.              | `"J Rouge HP"`    |
| `[ ] Jour Rouge`                      | Rend visible dans HomeKit le détecteur de contact pour les jours rouges.                    | `true`            |
| `Nom de l'accessoire (Jour Rouge)`    | Nom personnalisé pour le détecteur de contact des jours rouges.                             | `"J Rouge"`       |

etc pour les couleurs blanches et bleues

## Fonctionnement de la mise à jour des données du plugin Tempo\*\*

Chronologie :

Jour J :

- A 11h, le site web d'EDF met à jour la couleur des jours J+1
- A 12h, le plugin Tempo récupère la couleur du jour J+1 depuis le site EDF. Si la récupération échoue, il réessaie 2 heures plus tard.

Le lendemain J+1 :

- A 6h (le moment ou la nouvelle couleur et tarification associée s'applique), les détecteurs de contact HomeKit représentant les couleurs des jours s'activent ou se désactivent. Exemple : si le jour devient rouge, les détecteurs "Jours Rouge" et "Jour Rouge HP" s'activent et tous les autres se désactivent.
- A 22h (le moment du passage en Heures creuses), le détecteur "Jour Rouge" reste activé, le détecteur "Jour Rouge HC" s'active et le détecteur "Jour Rouge HP" se désactive. Exemple : si le jour est rouge, le détecteur « Jour Rouge HC » s'active le détecteur, le détecteur « Jour Rouge HP » se désactive et et le détecteur "Jour Rouge" reste actif.

etc.

Cette stratégie de mise à jour des données évite d'avoir à solliciter à intervalles répétés le site Web EDF-RTE inutilement.

NB : au démarrage ou lors d'un redémarrage du plugin, le plugin met à jour immédiatement tous les détecteurs et récupère les données de J+1.

## Ressources

- [Site Web EDF donnant la couleur des jours Tempo](https://particulier.edf.fr/fr/accueil/gestion-contrat/options/tempo.html#/)
- [Homebridge](https://homebridge.io/)

## Support

Pour toute question ou problème, ouvrez une [issue](https://github.com/chrisbansart/homebridge-tempo/issues).

---

## Licence

ICS © 2024 [Christophe Bansart - KDetude](https://github.com/chrisbansart)
