
import { HaApi } from "./type_base";

/** 
 * https://developers.home-assistant.io/docs/core/entity/sensor/
 * https://github.com/home-assistant/core/blob/dev/homeassistant/components/sensor/__init__.py
 **/
export namespace EntitySensor {

    export type SensorState = "opening" | "closing" | "closed" | "open" | "stopped"; // prefer 'closed'/'open' over 'stopped'!

    export interface State extends HaApi.EntityStateBase {
        /** usually the value, e.g. "77.52" or */
        state: string;
        attributes: {
            friendly_name: string;

            device_class: SensorClass;

            unit_of_measurement?: string;
            voltage?: number;
            temperature?: number;
            power_outage_count?: number;
            linkquality?: number;
            battery?: number;
            /** ISO time when last seen */
            last_seen?: string;

            /*
                "state_class": "measurement",
                "battery": 3,
                "humidity": 77.52,
                "last_seen": "2023-12-16T20:12:31.672Z",
                "linkquality": 31,
                "power_outage_count": 3135,
                "temperature": 5.21,
                "voltage": 2855,
                "unit_of_measurement": "%",
                "device_class": "humidity",
                "friendly_name": "TEMP_OUTSIDE Luftfeuchtigkeit"
            */
        }
    };


export type SensorClass = 
    // --- Non-numerical device classes ---

    /** Date.
        Unit of measurement: `None`
        ISO8601 format: https://en.wikipedia.org/wiki/ISO_8601 */
    "date"

    /** Enumeration.
        Provides a fixed list of options the state of the sensor can be in.
        Unit of measurement: `None` */
    | "enum"

    /** Timestamp.
        Unit of measurement: `None`
        ISO8601 format: https://en.wikipedia.org/wiki/ISO_8601 */
    | "timestamp"

    // -- Numerical device classes, these should be aligned with NumberDeviceClass ---

    /** Apparent power.
        Unit of measurement: `VA` */
    | "apparent_power"

    /** Air Quality Index.
        Unit of measurement: `None` */
    | "aqi"

    /** Atmospheric pressure.
        Unit of measurement: `UnitOfPressure` units */
    | "atmospheric_pressure"

    /** Percentage of battery that is left.
        Unit of measurement: `%` */
    | "battery"

    /** Carbon Monoxide gas concentration.
        Unit of measurement: `ppm` (parts per million) */
    | "carbon_monoxide"

    /** Carbon Dioxide gas concentration.
        Unit of measurement: `ppm` (parts per million) */
    | "carbon_dioxide"

    /** Current.
        Unit of measurement: `A`, `mA` */
    | "current"

    /** Data rate.
        Unit of measurement: UnitOfDataRate */
    | "data_rate"

    /** Data size.
        Unit of measurement: UnitOfInformation */
    | "data_size"

    /** Generic distance.
        Unit of measurement: `LENGTH_*` units
        - SI /metric: `mm`, `cm`, `m`, `km`
        - USCS / imperial: `in`, `ft`, `yd`, `mi` */
    | "distance"

    /** Fixed duration.
        Unit of measurement: `d`, `h`, `min`, `s`, `ms` */
    | "duration"

    /** Energy.
        Use this device class for sensors measuring energy consumption, for example
        electric energy consumption.
        Unit of measurement: `Wh`, `kWh`, `MWh`, `MJ`, `GJ` */
    | "energy"

    /** Stored energy.
        Use this device class for sensors measuring stored energy, for example the amount
        of electric energy currently stored in a battery or the capacity of a battery.
        Unit of measurement: `Wh`, `kWh`, `MWh`, `MJ`, `GJ` */
    | "energy_storage"

    /** Frequency.
        Unit of measurement: `Hz`, `kHz`, `MHz`, `GHz` */
    | "frequency"

    /** Gas.
        Unit of measurement:
        - SI / metric: `m³`
        - USCS / imperial: `ft³`, `CCF` */
    | "gas"

    /** Relative humidity.
        Unit of measurement: `%` */
    | "humidity"

    /** Illuminance.
        Unit of measurement: `lx` */
    | "illuminance"

    /** Irradiance.
        Unit of measurement:
        - SI / metric: `W/m²`
        - USCS / imperial: `BTU/(h⋅ft²)` */
    | "irradiance"

    /** Moisture.
        Unit of measurement: `%` */
    | "moisture"

    /** Amount of money.
        Unit of measurement: ISO4217 currency code
        See https://en.wikipedia.org/wiki/ISO_4217#Active_codes for active codes */
    | "monetary"

    /** Amount of NO2.
        Unit of measurement: `µg/m³` */
    | "nitrogen_dioxide"

    /** Amount of NO.
        Unit of measurement: `µg/m³` */
    | "nitrogen_monoxide"

    /** Amount of N2O.
        Unit of measurement: `µg/m³` */
    | "nitrous_oxide"

    /** Amount of O3.
        Unit of measurement: `µg/m³` */
    | "ozone"

    /** Potential hydrogen (acidity/alkalinity).
        Unit of measurement: Unitless */
    | "ph"

    /** Particulate matter <= 1 μm.
        Unit of measurement: `µg/m³` */
    | "pm1"
    
    /* Particulate matter <= 10 μm.
        Unit of measurement: `µg/m³` */
    | "pm10"

    /** Particulate matter <= 2.5 μm.
        Unit of measurement: `µg/m³` */
    | "pm25"

    /** Power factor.
        Unit of measurement: `%`, `None` */
    | "power_factor"

    /** Power.
        Unit of measurement: `W`, `kW` */
    | "power"

    /** Accumulated precipitation.
        Unit of measurement: UnitOfPrecipitationDepth
        - SI / metric: `cm`, `mm`
        - USCS / imperial: `in` */
    | "precipitation"

    /** Precipitation intensity.
        Unit of measurement: UnitOfVolumetricFlux
        - SI /metric: `mm/d`, `mm/h`
        - USCS / imperial: `in/d`, `in/h` */
    | "precipitation_intensity"

    /** Pressure.
        Unit of measurement:
        - `mbar`, `cbar`, `bar`
        - `Pa`, `hPa`, `kPa`
        - `inHg`
        - `psi` */
    | "pressure"

    /** Reactive power.
        Unit of measurement: `var` */
    | "reactive_power"

    /** Signal strength.
        Unit of measurement: `dB`, `dBm` */
    | "signal_strength"

    /** Sound pressure.
        Unit of measurement: `dB`, `dBA` */
    | "sound_pressure"

    /** Generic speed.
        Unit of measurement: `SPEED_*` units or `UnitOfVolumetricFlux`
        - SI /metric: `mm/d`, `mm/h`, `m/s`, `km/h`
        - USCS / imperial: `in/d`, `in/h`, `ft/s`, `mph`
        - Nautical: `kn` */
    | "speed"

    /** Amount of SO2.
        Unit of measurement: `µg/m³` */
    | "sulphur_dioxide"

    /** Temperature.
        Unit of measurement: `°C`, `°F`, `K` */
    | "temperature"

    /** Amount of VOC.
        Unit of measurement: `µg/m³` */
    | "volatile_organic_compounds"

    /** Ratio of VOC.
        Unit of measurement: `ppm`, `ppb` */
    | "volatile_organic_compounds_parts"

    /** Voltage.
        Unit of measurement: `V`, `mV` */
    | "voltage"

    /** Generic volume.
        Unit of measurement: `VOLUME_*` units
        - SI / metric: `mL`, `L`, `m³`
        - USCS / imperial: `ft³`, `CCF`, `fl. oz.`, `gal` (warning: volumes expressed in
        USCS/imperial units are currently assumed to be US volumes) */
    | "volume"

    /** Generic stored volume.

        Use this device class for sensors measuring stored volume, for example the amount
        of fuel in a fuel tank.

        Unit of measurement: `VOLUME_*` units
        - SI / metric: `mL`, `L`, `m³`
        - USCS / imperial: `ft³`, `CCF`, `fl. oz.`, `gal` (warning: volumes expressed in
        USCS/imperial units are currently assumed to be US volumes) */
    | "volume_storage"

    /** Water.
        Unit of measurement:
        - SI / metric: `m³`, `L`
        - USCS / imperial: `ft³`, `CCF`, `gal` (warning: volumes expressed in
        USCS/imperial units are currently assumed to be US volumes)
        */
    | "water"

    /** Generic weight, represents a measurement of an object's mass.
        Weight is used instead of mass to fit with every day language.
        Unit of measurement: `MASS_*` units
        - SI / metric: `µg`, `mg`, `g`, `kg`
        - USCS / imperial: `oz`, `lb` */
    | "weight"

    /** Wind speed.
        Unit of measurement: `SPEED_*` units
        - SI /metric: `m/s`, `km/h`
        - USCS / imperial: `ft/s`, `mph`
        - Nautical: `kn` */
    | "wind_speed";
    
}