import { API, DynamicPlatformPlugin, Logging, PlatformAccessory, PlatformConfig, Service, Characteristic } from 'homebridge';
import axios from 'axios';
import moment from 'moment-timezone';

const PLUGIN_NAME = 'homebridge-tempo';
const PLATFORM_NAME = 'Tempo';

interface TempoContext {
  colorCode: number;
  colorName: string;
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
      { colorCode: 3, colorName: this.config.jourRougeName || 'J Rouge', enabled: this.config.jourRougeEnabled !== false },
      { colorCode: 2, colorName: this.config.jourBlancName || 'J Blanc', enabled: this.config.jourBlancEnabled !== false },
      { colorCode: 1, colorName: this.config.jourBleuName || 'J Bleu', enabled: this.config.jourBleuEnabled !== false },
    ];

    // Remove any existing accessories that we no longer maintain
    const existingAccessories = Array.from(this.accessories.values());
    const keepAccessories = new Set<string>();

    defaultConfig.forEach(data => {
      if (!data.enabled) {
        this.log.info(`Skipping disabled accessory: ${data.colorName}`);
        return;
      }

      const uuid = this.api.hap.uuid.generate(`tempo-${data.colorCode}`);
      keepAccessories.add(uuid);

      let accessory = this.accessories.get(uuid);

      if (!accessory) {
        // Create new accessory
        this.log.info(`Adding new accessory: ${data.colorName}`);
        accessory = new this.api.platformAccessory(data.colorName, uuid);
        this.setupAccessoryServices(accessory, data);
        this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);
        this.accessories.set(uuid, accessory);
      } else {
        // Update existing accessory
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
    // Set up AccessoryInformation service
    const informationService = accessory.getService(this.api.hap.Service.AccessoryInformation) ||
      accessory.addService(this.api.hap.Service.AccessoryInformation);

    informationService
      .setCharacteristic(this.api.hap.Characteristic.Manufacturer, 'HomeBridge Tempo')
      .setCharacteristic(this.api.hap.Characteristic.Model, 'Tempo');

    // Set up or update ContactSensor service
    const sensorService = accessory.getService(this.api.hap.Service.ContactSensor) ||
      accessory.addService(this.api.hap.Service.ContactSensor, data.colorName, `tempo-${data.colorCode}`);

    sensorService
      .setCharacteristic(this.api.hap.Characteristic.Name, data.colorName)
      .setCharacteristic(this.api.hap.Characteristic.ConfiguredName, data.colorName);

    sensorService.getCharacteristic(this.api.hap.Characteristic.ContactSensorState)
      .onGet(() => this.lastCodeJour === data.colorCode);

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
    const nextUpdate = moment().tz('Europe/Paris').startOf('day').add(11, 'hours');

    if (now.isAfter(nextUpdate)) {
      nextUpdate.add(1, 'days');
    }

    const timeUntilNextUpdate = nextUpdate.diff(now);
    setTimeout(() => {
      this.updateTempoData();
      this.scheduleTempoDataUpdate();
    }, timeUntilNextUpdate);
  }

  private scheduleTempoDayColorUpdate(): void {
    const now = moment().tz('Europe/Paris');
    const nextUpdate = moment().tz('Europe/Paris').startOf('day').add(6, 'hours');

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
