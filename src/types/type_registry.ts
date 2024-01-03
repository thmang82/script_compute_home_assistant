

export namespace Registry {

    export interface Area {
        area_id: string,
        name: string
    }

    export interface Entity {
        area_id:  string | null;
        /** e.g.  "22cc3d31f0cd4dffda4826138a7635b5" */
        config_entry_id: string;
        /** e.g. "8bba72a8e99cd1116636d342adf4c4b0" */
        device_id:  string
        disabled_by:  string | null;
        entity_category:  "diagnostic" | string;
        /** e.g. "sensor.sun_next_dawn" */
        entity_id: string;
        has_entity_name:  boolean;
        hidden_by:  string | null;
        icon:  string | null;
        /** e.g. "895d73c39356a2c5fa24146b6cd5bc6c" */
        id: string;
        name: string | null;
        options:  {
            conversation: {
                should_expose: boolean
            }
        },
        /** e.g. "Nächste Morgendämmerung" */
        original_name: string;
        /* e.g. "sun" */
        platform: string;
        /** e.g. "next_dawn" */
        translation_key: string;
        /** e.g. "22cc3d31f0cd4dffda4826138a7635b5-next_dawn" */
        unique_id: string;
    }

    export interface Device {
        id: string;
        /** The name in the system */
        name: string;
        /** The area this is attached to */
        area_id: string | null;
        identifiers: [string, string][];
        entry_type: "service" | null;
        disabled_by: string | null;
        config_entries: string[];

        manufacturer: string | null;
        model: string | null;
        sw_version: string | null;
        serial_number: string | null;
        via_device_id: string | null;
        hw_version: string | null;

        /** The name override given by the user */
        name_by_user: string | null;
    }
}
