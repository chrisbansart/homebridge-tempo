import { API, DynamicPlatformPlugin, Logging, PlatformAccessory, PlatformConfig, Service, Characteristic } from 'homebridge';
import axios from 'axios';
import moment from 'moment-timezone';

const PLUGIN_NAME = 'homebridge-tempo';
const PLATFORM_NAME = 'Tempo';

interface TempoContext {
  colorCode: number;
  colorName: string;
  isHC: boolean; // Ajout de la propriété isHC
}
class TempoPlatform implements DynamicPlatformPlugin {
  private readonly apiEndpoint = 'https://www.services-rte.com/cms/open_data/v1/tempo';
  private readonly accessories: Map<string, PlatformAccessory> = new Map();
  private dataTempo: { [key: string]: string } = {};
  private lastCodeJour: number = 0;

  private readonly log: Logging;
  private readonly config: PlatformConfig;
  private readonly api: API;

  constructor(
    log: Logging,
    config: PlatformConfig,
    api: API,
  ) {
    this.log = log;
    this.config = config;
    this.api = api;

    this.api.on('didFinishLaunching', () => {
      this.initializeAccessories();
      this.updateTempoData().then(() => {
        this.updateTempoDayColor();
        this.scheduleTempoDataUpdate();
        this.scheduleTempoDayColorUpdate();
      });
    });
  }

  configureAccessory(accessory: PlatformAccessory): void {
    this.log.info(`Loading accessory from cache: ${accessory.displayName}`);
    this.accessories.set(accessory.UUID, accessory);
  }

  private initializeAccessories(): void {
    const defaultConfig = [
    { colorCode: 3, colorName: this.config.jourRougeHPName || 'J Rouge HP', enabled: this.config.jourRougeHPEnabled !== false, isHC: false },
    { colorCode: 2, colorName: this.config.jourBlancHPName || 'J Blanc HP', enabled: this.config.jourBlancHPEnabled !== false, isHC: false },
    { colorCode: 1, colorName: this.config.jourBleuHPName || 'J Bleu HP', enabled: this.config.jourBleuHPEnabled !== false, isHC: false },
    { colorCode: 3, colorName: this.config.jourRougeHCName || 'J Rouge HC', enabled: this.config.jourRougeHCEnabled !== false, isHC: true },
    { colorCode: 2, colorName: this.config.jourBlancHCName || 'J Blanc HC', enabled: this.config.jourBlancHCEnabled !== false, isHC: true },
    { colorCode: 1, colorName: this.config.jourBleuHCName || 'J Bleu HC', enabled: this.config.jourBleuHCEnabled !== false, isHC: true },
  ];

    // Remove any existing accessories that we no longer maintain
    const existingAccessories = Array.from(this.accessories.values());
    const keepAccessories = new Set<string>();

defaultConfig.forEach(data => {
  if (!data.enabled) {
    this.log.info(`Skipping disabled accessory: ${data.colorName}`);
    return;
  }

  // Utiliser les anciens UUID pour HP et de nouveaux pour HC
  const uuid = data.isHC 
    ? this.api.hap.uuid.generate(`tempo-${data.colorCode}-HC`) 
    : this.api.hap.uuid.generate(`tempo-${data.colorCode}`); // Ancien UUID sans HC

  keepAccessories.add(uuid);

  let accessory = this.accessories.get(uuid);

  if (!accessory) {
    // Créer un nouvel accessoire
    this.log.info(`Adding new accessory: ${data.colorName}`);
    accessory = new this.api.platformAccessory(data.colorName, uuid);
    this.setupAccessoryServices(accessory, data);
    this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);
    this.accessories.set(uuid, accessory);
  } else {
    // Mettre à jour l'accessoire existant
    this.log.info(`Updating existing accessory: ${data.colorName}`);
    this.setupAccessoryServices(accessory, data);
  }
});



    // Remove unused accessories
    existingAccessories
      .filter(accessory => !keepAccessories.has(accessory.UUID))
      .forEach(accessory => {
        this.log.info(`Removing unused accessory: ${accessory.displayName}`);
        this.api.unregisterPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);
        this.accessories.delete(accessory.UUID);
      });
  }

private setupAccessoryServices(accessory: PlatformAccessory, data: TempoContext): void {
  const { colorCode, colorName, isHC } = data;
  const serviceSuffix = isHC ? 'HC' : 'HP';

  const informationService = accessory.getService(this.api.hap.Service.AccessoryInformation) ||
    accessory.addService(this.api.hap.Service.AccessoryInformation);

  informationService
    .setCharacteristic(this.api.hap.Characteristic.Manufacturer, 'HomeBridge Tempo')
    .setCharacteristic(this.api.hap.Characteristic.Model, `Tempo ${serviceSuffix}`);

  const sensorService = accessory.getService(this.api.hap.Service.ContactSensor) ||
    accessory.addService(this.api.hap.Service.ContactSensor, colorName, `tempo-${colorCode}-${serviceSuffix}`);

  sensorService
    .setCharacteristic(this.api.hap.Characteristic.Name, colorName)
    .setCharacteristic(this.api.hap.Characteristic.ConfiguredName, colorName);

  sensorService.getCharacteristic(this.api.hap.Characteristic.ContactSensorState)
    .onGet(() => this.isCurrentTimeHC() === isHC && this.lastCodeJour === colorCode);

  accessory.context.tempo = data;
}

  private getCurrentSeason(): string {
    const now = moment().tz('Europe/Paris');
    const currentYear = now.year();
    const currentMonth = now.month() + 1;

    if (currentMonth >= 9) {
      return `${currentYear}-${currentYear + 1}`;
    } else {
      return `${currentYear - 1}-${currentYear}`;
    }
  }

  private async updateTempoData(): Promise<void> {
    try {
      const season = this.getCurrentSeason();
      const response = await axios.get<{ values: { [key: string]: string } }>(
        `${this.apiEndpoint}?season=${season}`
      );
      this.dataTempo = response.data.values;
      this.log.info(`[${moment().tz('Europe/Paris').format()}] Tempo data updated.`);
    } catch (error) {
      this.log.error(`Erreur de mise à jour des données Tempo : ${error instanceof Error ? error.message : String(error)}`);
      setTimeout(() => this.updateTempoData(), 2 * 60 * 60 * 1000);
    }
  }

  private updateTempoDayColor(): void {
    const today = this.getCurrentTempoDate();
    const currentCodeJour = this.getColorCodeForDate(today);

    if (this.lastCodeJour !== currentCodeJour) {
      this.lastCodeJour = currentCodeJour;

      this.accessories.forEach(accessory => {
        const tempoContext = accessory.context.tempo as TempoContext;
        const isActive = tempoContext.colorCode === this.lastCodeJour;

        const sensorService = accessory.getService(this.api.hap.Service.ContactSensor);
        if (sensorService) {
          sensorService
            .getCharacteristic(this.api.hap.Characteristic.ContactSensorState)
            .updateValue(isActive);
        }

        this.log.info(`${tempoContext.colorName} est maintenant ${isActive ? 'ACTIVÉ' : 'DÉSACTIVÉ'}`);
      });

      this.log.info(`[${moment().tz('Europe/Paris').format()}] Tempo day color updated.`);
    } else {
      this.log.info('La couleur du jour n\'a pas changé.');
    }
  }

  private getCurrentTempoDate(): string {
    const now = moment().tz('Europe/Paris');
    const hours = now.hours();

    if (hours < 6) {
      now.subtract(1, 'days');
    }

    return now.format('YYYY-MM-DD');
  }

  private getColorCodeForDate(date: string): number {
    const color = this.dataTempo[date];
    switch (color) {
      case 'BLUE':
        return 1;
      case 'WHITE':
        return 2;
      case 'RED':
        return 3;
      default:
        return 0;
    }
  }


  
  private scheduleTempoDataUpdate(): void {
    const now = moment().tz('Europe/Paris');
    let nextUpdate = moment().tz('Europe/Paris').startOf('day').add(12, 'hours'); // Midi du jour actuel
    
    if (now.isAfter(nextUpdate)) {
        // Si 12h est déjà passé, effectuer une mise à jour immédiatement
        this.updateTempoData();
        // Planifier la prochaine mise à jour à midi du lendemain
        nextUpdate = moment().tz('Europe/Paris').startOf('day').add(1, 'days').add(12, 'hours');
    }

    const timeUntilNextUpdate = nextUpdate.diff(now);
    setTimeout(() => {
      this.updateTempoData();
      this.scheduleTempoDataUpdate();
    }, timeUntilNextUpdate);
  }

  private isCurrentTimeHC(): boolean {
  const now = moment().tz('Europe/Paris');
  const hour = now.hour();
  return hour >= 22 || hour < 6; // HC de 22h à 6h
}

private scheduleTempoDayColorUpdate(): void {
  const now = moment().tz('Europe/Paris');
  let nextUpdate;

  if (this.isCurrentTimeHC()) {
    nextUpdate = now.clone().startOf('day').add(6, 'hours'); // Prochaine mise à jour à 6h
  } else {
    nextUpdate = now.clone().startOf('day').add(22, 'hours'); // Prochaine mise à jour à 22h
  }

  if (now.isAfter(nextUpdate)) {
    nextUpdate.add(1, 'days'); // Si l'heure est passée, passer au jour suivant
  }

  const timeUntilNextUpdate = nextUpdate.diff(now);
  setTimeout(() => {
    this.updateTempoDayColor();
    this.scheduleTempoDayColorUpdate();
  }, timeUntilNextUpdate);
}



}

export = (api: API) => {
  api.registerPlatform(PLUGIN_NAME, PLATFORM_NAME, TempoPlatform);
};
