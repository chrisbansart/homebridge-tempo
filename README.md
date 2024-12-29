# Homebridge Tempo

[![npm](https://img.shields.io/npm/v/homebridge-tempo)](https://www.npmjs.com/package/homebridge-tempo)
[![npm](https://img.shields.io/npm/dt/homebridge-tempo)](https://www.npmjs.com/package/homebridge-tempo)

Plugin Homebridge pour intégrer les couleurs journalières du service Tempo de RTE dans HomeKit sous forme de "Détecteurs de Contact". Permet de piloter sa consommation d'énergie et ses appareils connectés en fonction de la couleur du jour (tarif), en particulier durant les heures pleines des Jours rouges.

Exemples dans l'app Maison ou dans l'app EVE :

- Le détecteur Jour Rouge s'allume et l'heure est > 6h du matin ( heures pleines ) => Eteindre le cumulus
- Le détecteur Jour Rouge s'allume => Eteindre le chauffage de la chambre d'amis

## Fonctionnalités

- Affiche la couleur du jour (Rouge, Blanc, ou Bleu) en tant que capteurs dans HomeKit.
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
   Pour rappel la couleur du jour s'applique du 6h du matin jour J jusqu'à 6h du matin jour J+1

   Le plugin récupère quotidiennement les données de l'API Tempo officielle pour déterminer la couleur du jour J et du lendemain. La couleur du lendemain est publiée J-1 à 7h du matin par RTE. Le plugin la récupère à J-1 11h du matin. Si la récupération échoue, le plugin réessaye 2h plus tard.

2. **Mise à jour automatique**

   - Les données Tempo sont mises à jour à 11h tous les jours.
   - Les capteurs sont actualisés à 6h du matin pour refléter la nouvelle couleur du jour J. Le changement d'état des capteurs permet de déclencher les automatisations qui en tiennent compte.

## Ressources

- [Documentation officielle de Tempo](https://www.services-rte.com/)
- [Homebridge](https://homebridge.io/)

## Support

Pour toute question ou problème, ouvrez une [issue](https://github.com/chrisbansart/homebridge-tempo/issues).

---

## Licence

MIT © 2024 [Christophe Bansart - KDetude](https://github.com/chrisbansart)
