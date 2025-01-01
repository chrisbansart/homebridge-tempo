# Homebridge Tempo

[![verified-by-homebridge](https://badgen.net/badge/homebridge/verified/purple)](https://github.com/homebridge/homebridge/wiki/Verified-Plugins)
[![npm](https://img.shields.io/npm/v/homebridge-tempo)](https://www.npmjs.com/package/homebridge-tempo)
[![npm](https://img.shields.io/npm/dt/homebridge-tempo)](https://www.npmjs.com/package/homebridge-tempo)

Plugin Homebridge pour intégrer les couleurs journalières du service Tempo de RTE dans HomeKit sous forme de "Détecteurs de Contact". Permet de piloter sa consommation d'énergie et ses appareils connectés en fonction de la couleur du jour (tarif), en particulier durant les heures pleines des Jours rouges.

Exemples dans l'app Maison ou dans l'app EVE :

- Le détecteur Jour Rouge s'allume et l'heure est > 6h du matin ( heures pleines ) => Eteindre le cumulus
- Le détecteur Jour Rouge s'allume => Eteindre le chauffage de la chambre d'amis et réduire le chauffage électrique des autres chambres jusqu'à 22h (jours rouges heures pleines)

## Fonctionnalités

- Affiche la couleur du jour (Rouge, Blanc, ou Bleu) en tant que capteurs ("Détecteurs de contact") dans HomeKit.
- Mise à jour automatique des données Tempo à partir de l'url de RTE.
- Personnalisation des noms des capteurs via la configuration.
- Possibilité d'inclure ou pas certains capteurs (Rouge, Blanc, Bleu) via les réglages

## Installation

Via le moteur de recherche de plugin de Homebridge.

## Configuration

Les options de configuration disponibles sont :

| Champ                              | Type    | Description                                           | Valeur par défaut |
| ---------------------------------- | ------- | ----------------------------------------------------- | ----------------- |
| `[ ] Jour Rouge`                   | Boolean | Active le capteur pour les jours rouges.              | `true`            |
| `Nom de l'accessoire (Jour Rouge)` | String  | Nom personnalisé pour le capteur des jours rouges.    | `"J Rouge"`       |
| `[ ] Jour Blanc`                   | Boolean | Active ou désactive le capteur pour les jours blancs. | `true`            |
| `Nom de l'accessoire (Jour Blanc)` | String  | Nom personnalisé pour le capteur des jours blancs.    | `J Blanc`         |
| `[ ] Jour Bleu`                    | Boolean | Active ou désactive le capteur pour les jours bleus.  | `true`            |
| `Nom de l'accessoire (Jour Bleu)`  | String  | Nom personnalisé pour le capteur des jours bleus.     | `"J Bleu"`        |

## Fonctionnement

1. **Synchronisation avec l'API Tempo**  
   Pour rappel, la couleur du jour s'applique de 6h du matin jour J jusqu'à 6h du matin jour J+1 et RTE publie la couleur du lendemain chaque jour à 7h du matin.

   Le plugin homebridge-tempo récupère l'information depuis le site RTE sur la couleur du lendemain tous les jours à 11h du matin. Si la récupération échoue, le plugin réessaye 2h plus tard.

   Au premier démarrage ou lors d'un redémarrage, le plugin récupère et met à jour les informations des couleurs du jour et du lendemain.

2. **Mise à jour automatique**

   - Les capteurs sont actualisés à 6h du matin pour refléter la nouvelle couleur du jour. Le changement d'état des capteurs permet de déclencher les automatisations qui en tiennent compte.

## Ressources

- [Documentation officielle de Tempo](https://www.services-rte.com/)
- [Homebridge](https://homebridge.io/)

## Support

Pour toute question ou problème, ouvrez une [issue](https://github.com/chrisbansart/homebridge-tempo/issues).

---

## Licence

ICS © 2024 [Christophe Bansart - KDetude](https://github.com/chrisbansart)
