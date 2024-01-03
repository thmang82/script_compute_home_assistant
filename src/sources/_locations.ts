import { verbose } from "../script";
import { sRegistry } from "../registry";
import { EntityExtGeneric } from "../types/type_extended";
import { Setup } from "../setup";

 /** 
     * The entity states need to be enriched with location information.
     * Either after they where first added, or when the entitiy registry changes
     * 
     * Returns the new list of entities
     */
 export function recomputeLocations<T extends EntityExtGeneric>(log_pre: string, entities: T[], added_entities?: T[]): T[] | undefined {
    const log_prefix = `recomputeLocations[${log_pre}]: `;

    let ret_arr: T[] | undefined;;

    const location_all = sRegistry.getLocationAll();
    const entities_map = sRegistry.data_entities_map;
    const devices_map  = sRegistry.data_devices_map;

    if (sRegistry.data_entities_arr.length <= 0) {
        if (verbose) {
            console.debug(log_prefix + "no entities loaded yet, no process (would clear list)");
        }
        return;
    }

    const entities_in = entities.length;
    let found_loc = 0;
    let found_entities = 0;

    const modifyEntity = (cover_o: EntityExtGeneric) => {
        const entity_o = entities_map[cover_o.entity_id];
        let location_ids: string[] = [ location_all.id ];
        if (entity_o) {
            found_entities++;
            const dev_o = devices_map[entity_o.device_id];

            const area_id = entity_o.area_id;
            const area_dev_id = dev_o?.area_id;
            if (area_id || area_dev_id) {
                if (area_id) {
                    location_ids.push(area_id);
                }
                if (area_dev_id && location_ids.indexOf(area_dev_id) < 0) {
                    location_ids.push(area_dev_id);
                }
                found_loc++;
            }
            for (const floor of Setup.floor_setup) {
                let found_num = 0;
                for (const id of location_ids) {
                    found_num += floor.area_ids.indexOf(id) >= 0 ? 1 : 0;
                }
                if (found_num > 0) {
                    location_ids.push(floor.ident);
                }
            }
        }
        cover_o.location_ids = location_ids;
        return entity_o;
    }
    if (added_entities) {
        added_entities.forEach(cover_o => {
            modifyEntity(cover_o);
        })
    } else {
        ret_arr = entities.filter(cover_o => {
            const entity_o = modifyEntity(cover_o);
            return entity_o ? true : false;
        })
    }
    if (verbose && !added_entities) {
        console.debug(log_prefix + "entities: ", entities_in, found_loc, found_entities, ret_arr ? ret_arr.length : 0, ret_arr);
    }
    const covers_removed = ret_arr ? entities_in - ret_arr.length : 0;
    if (covers_removed > 0) {
        console.log(log_prefix + `removed ${covers_removed} covers that do not exist any more`);
    }
    return ret_arr;
}

export function getStateExt<T extends EntityExtGeneric>(new_o: T, old_o: T): T {
    if (old_o.location_ids) {
        new_o.location_ids = old_o.location_ids;
    }
    return new_o;
}