# Homebridge Tempo

[![verified-by-homebridge](https://badgen.net/badge/homebridge/verified/purple)](https://github.com/homebridge/homebridge/wiki/Verified-Plugins)
[![npm](https://img.shields.io/npm/v/homebridge-tempo)](https://www.npmjs.com/package/homebridge-tempo)
[![npm](https://img.shields.io/npm/dt/homebridge-tempo)](https://www.npmjs.com/package/homebridge-tempo)

Le Plugin Homebridge Tempo permet d'intégrer les couleurs journalières du service Tempo de EDF-RTE dans HomeKit sous forme de "Détecteurs de Contact". Il permet de piloter sa consommation d'énergie et ses appareils connectés en fonction de la couleur du jour (tarif), en particulier durant les heures pleines (entre 6h et 22h) des jours rouges.

Exemples d'automatisations dans l'app Maison pour limiter la consommation électrique les heures pleines des jours rouges :

- Le détecteur Jour Rouge s'allume => Eteindre le cumulus & éteindre le chauffage de la chambre d'amis & Réduire le chauffage électrique des autres chambres & Arrêter la charge de la voiture électrique

Dans tous les cas lors du passage en heures creuses quelle que soit la couleur du jour :

- Lorsqu’il est 22h => Allumer le cumulus et régler tous les radiateurs électriques en mode standard & Démarrer la charge de la voiture électrique

## Fonctionnalités

- Affiche la couleur du jour (Rouge, Blanc, ou Bleu) en tant que capteurs ("Détecteurs de contact") dans HomeKit.
- Mise à jour automatique des données Tempo à partir du site web de EDF-RTE Tempo.
- Personnalisation des noms des capteurs via la configuration.
- Possibilité de sélectionner ou pas certains capteurs (Rouge, Blanc, Bleu) via les réglages

## Installation

Via le moteur de recherche de plugin de Homebridge
ou
`npm i homebridge-tempo`

## Configuration du plugin

Les options de configuration disponibles sont :

| Champ                              | Type    | Description                                           | Valeur par défaut |
| ---------------------------------- | ------- | ----------------------------------------------------- | ----------------- |
| `[ ] Jour Rouge`                   | Boolean | Active le capteur pour les jours rouges.              | `true`            |
| `Nom de l'accessoire (Jour Rouge)` | String  | Nom personnalisé pour le capteur des jours rouges.    | `"J Rouge"`       |
| `[ ] Jour Blanc`                   | Boolean | Active ou désactive le capteur pour les jours blancs. | `true`            |
| `Nom de l'accessoire (Jour Blanc)` | String  | Nom personnalisé pour le capteur des jours blancs.    | `J Blanc`         |
| `[ ] Jour Bleu`                    | Boolean | Active ou désactive le capteur pour les jours bleus.  | `true`            |
| `Nom de l'accessoire (Jour Bleu)`  | String  | Nom personnalisé pour le capteur des jours bleus.     | `"J Bleu"`        |

## Fonctionnement de la mise à jour des données du plugin Tempo\*\*

Chronologie :

Jour J :

- A 11h, le site web d'EDF met à jour la couleur des jours J+1
- A 12h, le plugin Tempo récupère la couleur du jour J+1 depuis le site EDF. Si la récupération échoue, il réessaie 2 heures plus tard.

Le lendemain J+1 :

- A 6h du matin, les détecteurs de contact HomeKit représentant les couleurs des jours s'activent ou se désactivent. Exemple : si le jour est rouge, le détecteur « jour rouge » s'active.

etc.
Cette stratégie de mise à jour des données évite d'avoir à solliciter à intervalles répétés le site Web EDF-RTE inutilement.

NB :
Au premier démarrage ou lors d'un redémarrage du plugin après 12h, le plugin récupère et met à jour immédiatement les couleurs du lendemain.

## Ressources

- [Site Web EDF donnant la couleur des jours Tempo](https://particulier.edf.fr/fr/accueil/gestion-contrat/options/tempo.html#/)
- [Homebridge](https://homebridge.io/)

## Support

Pour toute question ou problème, ouvrez une [issue](https://github.com/chrisbansart/homebridge-tempo/issues).

---

## Licence

ICS © 2024 [Christophe Bansart - KDetude](https://github.com/chrisbansart)
