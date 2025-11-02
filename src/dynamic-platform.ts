import { API, DynamicPlatformPlugin, Logging, PlatformAccessory, PlatformConfig, Service, Characteristic } from 'homebridge';
import axios from 'axios';
import moment from 'moment-timezone';

const PLUGIN_NAME = 'homebridge-tempo';
const PLATFORM_NAME = 'Tempo';
interface TempoContext {
  colorCode: number;
  colorName: string;
  isHC: boolean | null;
  isJ1: boolean; // Nouveau: indique si c'est un contacteur J+1
}

class TempoPlatform implements DynamicPlatformPlugin {
  private readonly apiEndpoint = 'https://www.services-rte.com/cms/open_data/v1/tempo';
  private readonly accessories: Map<string, PlatformAccessory> = new Map();
  private dataTempo: { [key: string]: string } = {};
  private lastCodeJour: number = 0;
  private lastCodeJourJ1: number = 0; // Nouveau: code couleur pour J+1

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
    // Contacteurs J (jour actuel)
    { colorCode: 3, colorName: this.config.jourRougeHPName || 'J Rouge HP', enabled: this.config.jourRougeHPEnabled !== false, isHC: false, isJ1: false },
    { colorCode: 2, colorName: this.config.jourBlancHPName || 'J Blanc HP', enabled: this.config.jourBlancHPEnabled !== false, isHC: false, isJ1: false },
    { colorCode: 1, colorName: this.config.jourBleuHPName || 'J Bleu HP', enabled: this.config.jourBleuHPEnabled !== false, isHC: false, isJ1: false },
    { colorCode: 3, colorName: this.config.jourRougeHCName || 'J Rouge HC', enabled: this.config.jourRougeHCEnabled !== false, isHC: true, isJ1: false },
    { colorCode: 2, colorName: this.config.jourBlancHCName || 'J Blanc HC', enabled: this.config.jourBlancHCEnabled !== false, isHC: true, isJ1: false },
    { colorCode: 1, colorName: this.config.jourBleuHCName || 'J Bleu HC', enabled: this.config.jourBleuHCEnabled !== false, isHC: true, isJ1: false },
    { colorCode: 3, colorName: this.config.jourRougeName || 'J Rouge', enabled: this.config.jourRougeEnabled !== false, isHC: null, isJ1: false },
    { colorCode: 2, colorName: this.config.jourBlancName || 'J Blanc', enabled: this.config.jourBlancEnabled !== false, isHC: null, isJ1: false },
    { colorCode: 1, colorName: this.config.jourBleuName || 'J Bleu', enabled: this.config.jourBleuEnabled !== false, isHC: null, isJ1: false },
    
    // Contacteurs J+1 (jour suivant)
    { colorCode: 3, colorName: this.config.jourRougeHPJ1Name || 'J+1 Rouge HP', enabled: this.config.jourRougeHPJ1Enabled !== false, isHC: false, isJ1: true },
    { colorCode: 2, colorName: this.config.jourBlancHPJ1Name || 'J+1 Blanc HP', enabled: this.config.jourBlancHPJ1Enabled !== false, isHC: false, isJ1: true },
    { colorCode: 1, colorName: this.config.jourBleuHPJ1Name || 'J+1 Bleu HP', enabled: this.config.jourBleuHPJ1Enabled !== false, isHC: false, isJ1: true },
    { colorCode: 3, colorName: this.config.jourRougeHCJ1Name || 'J+1 Rouge HC', enabled: this.config.jourRougeHCJ1Enabled !== false, isHC: true, isJ1: true },
    { colorCode: 2, colorName: this.config.jourBlancHCJ1Name || 'J+1 Blanc HC', enabled: this.config.jourBlancHCJ1Enabled !== false, isHC: true, isJ1: true },
    { colorCode: 1, colorName: this.config.jourBleuHCJ1Name || 'J+1 Bleu HC', enabled: this.config.jourBleuHCJ1Enabled !== false, isHC: true, isJ1: true },
    { colorCode: 3, colorName: this.config.jourRougeJ1Name || 'J+1 Rouge', enabled: this.config.jourRougeJ1Enabled !== false, isHC: null, isJ1: true },
    { colorCode: 2, colorName: this.config.jourBlancJ1Name || 'J+1 Blanc', enabled: this.config.jourBlancJ1Enabled !== false, isHC: null, isJ1: true },
    { colorCode: 1, colorName: this.config.jourBleuJ1Name || 'J+1 Bleu', enabled: this.config.jourBleuJ1Enabled !== false, isHC: null, isJ1: true },
  ];

  const existingAccessories = Array.from(this.accessories.values());
  const keepAccessories = new Set<string>();

  defaultConfig.forEach(data => {
    if (!data.enabled) {
      this.log.info(`Skipping disabled accessory: ${data.colorName}`);
      return;
    }

    // Générer un UUID unique qui inclut l'information J ou J+1
    const dayPrefix = data.isJ1 ? 'j1' : 'j0';
    const uuid = data.isHC !== null
      ? this.api.hap.uuid.generate(`tempo-${dayPrefix}-${data.colorCode}-${data.isHC ? 'HC' : 'HP'}`)
      : this.api.hap.uuid.generate(`tempo-${dayPrefix}-${data.colorCode}`);

    keepAccessories.add(uuid);

    let accessory = this.accessories.get(uuid);

    if (!accessory) {
      this.log.info(`Adding new accessory: ${data.colorName}`);
      accessory = new this.api.platformAccessory(data.colorName, uuid);
      this.setupAccessoryServices(accessory, data);
      this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);
      this.accessories.set(uuid, accessory);
    } else {
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
  const { colorCode, colorName, isHC, isJ1 } = data;
  const serviceSuffix = isHC !== null ? (isHC ? 'HC' : 'HP') : '';
  const daySuffix = isJ1 ? 'J+1' : 'J';

  const informationService = accessory.getService(this.api.hap.Service.AccessoryInformation) ||
    accessory.addService(this.api.hap.Service.AccessoryInformation);

  informationService
    .setCharacteristic(this.api.hap.Characteristic.Manufacturer, 'HomeBridge Tempo')
    .setCharacteristic(this.api.hap.Characteristic.Model, `Tempo ${daySuffix} ${serviceSuffix}`);

  const sensorService = accessory.getService(this.api.hap.Service.ContactSensor) ||
    accessory.addService(this.api.hap.Service.ContactSensor, colorName, `tempo-${daySuffix}-${colorCode}-${serviceSuffix}`);

  sensorService
    .setCharacteristic(this.api.hap.Characteristic.Name, colorName)
    .setCharacteristic(this.api.hap.Characteristic.ConfiguredName, colorName);

  sensorService.getCharacteristic(this.api.hap.Characteristic.ContactSensorState)
    .onGet(() => {
      const currentCode = isJ1 ? this.lastCodeJourJ1 : this.lastCodeJour;
      
      if (isHC !== null) {
        return this.isCurrentTimeHC() === isHC && currentCode === colorCode;
      } else {
        return currentCode === colorCode;
      }
    });

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
      setTimeout(() => this.updateTempoData(), 1 * 60 * 60 * 1000);
    }
  }

private updateTempoDayColor(): void {
  const today = this.getCurrentTempoDate();
  const tomorrow = moment(today).add(1, 'days').format('YYYY-MM-DD');
  
  const currentCodeJour = this.getColorCodeForDate(today);
  const currentCodeJourJ1 = this.getColorCodeForDate(tomorrow);

  // Mise à jour pour J
  if (this.lastCodeJour !== currentCodeJour) {
    this.lastCodeJour = currentCodeJour;
    this.log.info(`[${moment().tz('Europe/Paris').format()}] Couleur J mise à jour: ${currentCodeJour}`);
  }

  // Mise à jour pour J+1
  if (this.lastCodeJourJ1 !== currentCodeJourJ1) {
    this.lastCodeJourJ1 = currentCodeJourJ1;
    this.log.info(`[${moment().tz('Europe/Paris').format()}] Couleur J+1 mise à jour: ${currentCodeJourJ1}`);
  }

  // Mise à jour de tous les accessoires
  this.accessories.forEach(accessory => {
    const tempoContext = accessory.context.tempo as TempoContext;
    const targetCode = tempoContext.isJ1 ? this.lastCodeJourJ1 : this.lastCodeJour;
    const isActive = tempoContext.colorCode === targetCode;

    const sensorService = accessory.getService(this.api.hap.Service.ContactSensor);
    if (sensorService) {
      sensorService
        .getCharacteristic(this.api.hap.Characteristic.ContactSensorState)
        .updateValue(isActive);
    }

    this.log.info(`${tempoContext.colorName} est maintenant ${isActive ? 'ACTIVÉ' : 'DÉSACTIVÉ'}`);
  });
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


  // Mise à jour depuis le site web RTE des couleurs des jours. Ici : 7h du matin
  private scheduleTempoDataUpdate(): void {
    const now = moment().tz('Europe/Paris');
    let nextUpdate = moment().tz('Europe/Paris').startOf('day').add(7, 'hours');
    
    if (now.isAfter(nextUpdate)) {
        this.updateTempoData();
        nextUpdate = moment().tz('Europe/Paris').startOf('day').add(1, 'days').add(7, 'hours');
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
  return hour >= 22 || hour < 6;
}

private scheduleTempoDayColorUpdate(): void {
  const now = moment().tz('Europe/Paris');
  let nextUpdate;

  if (this.isCurrentTimeHC()) {
    nextUpdate = now.clone().startOf('day').add(6, 'hours');
  } else {
    nextUpdate = now.clone().startOf('day').add(22, 'hours');
  }

  if (now.isAfter(nextUpdate)) {
    nextUpdate.add(1, 'days');
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