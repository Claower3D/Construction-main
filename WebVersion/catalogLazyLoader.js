/**
 * CatalogLazyLoader — ленивая загрузка каталогов работ и материалов
 * QazGost AI — Оптимизация загрузки 380+ справочных JS-файлов
 * 
 * Вместо загрузки всех wrk_*.js и mat_*.js при старте,
 * подгружает только нужные каталоги по требованию.
 */
(function () {
    'use strict';

    // Кэш загруженных каталогов
    const _loaded = new Set();
    const _loading = new Map(); // промисы текущих загрузок
    const _basePath = 'ai/data/';

    // Маппинг категорий → файлы (wrk) — ПОЛНЫЙ список (213 каталогов)
    const WRK_CATALOG_MAP = {
        'acoustics':              'wrk_acoustics.js',
        'amenities_full':         'wrk_amenities_full.js',
        'appliances':             'wrk_appliances.js',
        'automation':             'wrk_automation.js',
        'balcony':                'wrk_balcony.js',
        'bms':                    'wrk_bms.js',
        'bms2':                   'wrk_bms2.js',
        'bridges':                'wrk_bridges.js',
        'ceiling':                'wrk_ceiling.js',
        'cleanroom':              'wrk_cleanroom.js',
        'climate':                'wrk_climate.js',
        'commercial_ext2':        'wrk_commercial_ext2.js',
        'commercial_interiors':   'wrk_commercial_interiors.js',
        'commercial_medical':     'wrk_commercial_medical.js',
        'concrete':               'wrk_concrete.js',
        'concrete_ext2':          'wrk_concrete_ext2.js',
        'concrete_full':          'wrk_concrete_full.js',
        'cooling':                'wrk_cooling.js',
        'craneworks':             'wrk_craneworks.js',
        'datacenter':             'wrk_datacenter.js',
        'decor_elem':             'wrk_decor_elem.js',
        'decorative_ext':         'wrk_decorative_ext.js',
        'decorative_pool_misc':   'wrk_decorative_pool_misc.js',
        'demolition':             'wrk_demolition.js',
        'demolition_ext2':        'wrk_demolition_ext2.js',
        'demolition_full':        'wrk_demolition_full.js',
        'design_ext':             'wrk_design_ext.js',
        'design_services':        'wrk_design_services.js',
        'doors_windows_full':     'wrk_doors_windows_full.js',
        'doors_windows_gates':    'wrk_doors_windows_gates.js',
        'drywall':                'wrk_drywall.js',
        'drywall_ext2':           'wrk_drywall_ext2.js',
        'drywall_full':           'wrk_drywall_full.js',
        'earth_concrete_rebar_ext': 'wrk_earth_concrete_rebar_ext.js',
        'earthwork':              'wrk_earthwork.js',
        'earthwork_ext2':         'wrk_earthwork_ext2.js',
        'earthwork_full':         'wrk_earthwork_full.js',
        'electric_paint_tile_ext': 'wrk_electric_paint_tile_ext.js',
        'electrical':             'wrk_electrical.js',
        'electrical_ext2':        'wrk_electrical_ext2.js',
        'electrical_full':        'wrk_electrical_full.js',
        'electrical_full2':       'wrk_electrical_full2.js',
        'elevators':              'wrk_elevators.js',
        'elevators_full':         'wrk_elevators_full.js',
        'elevators2':             'wrk_elevators2.js',
        'emergency':              'wrk_emergency.js',
        'energy_eff':             'wrk_energy_eff.js',
        'energy_ext':             'wrk_energy_ext.js',
        'engineering':            'wrk_engineering.js',
        'ext_networks':           'wrk_ext_networks.js',
        'ext_utilities':          'wrk_ext_utilities.js',
        'extnet_full':            'wrk_extnet_full.js',
        'facade':                 'wrk_facade.js',
        'facade_ext2':            'wrk_facade_ext2.js',
        'facade_full':            'wrk_facade_full.js',
        'facade_full2':           'wrk_facade_full2.js',
        'facade_sys':             'wrk_facade_sys.js',
        'fences':                 'wrk_fences.js',
        'finishing_ext':          'wrk_finishing_ext.js',
        'finishing_full':         'wrk_finishing_full.js',
        'fire':                   'wrk_fire.js',
        'fire_safety':            'wrk_fire_safety.js',
        'fire_safety_full':       'wrk_fire_safety_full.js',
        'fireplaces':             'wrk_fireplaces.js',
        'firesuppress':           'wrk_firesuppress.js',
        'flooring':               'wrk_flooring.js',
        'flooring_ceiling_stairs': 'wrk_flooring_ceiling_stairs.js',
        'flooring_detail':        'wrk_flooring_detail.js',
        'foundation':             'wrk_foundation.js',
        'foundation_ext':         'wrk_foundation_ext.js',
        'foundation_full':        'wrk_foundation_full.js',
        'furniture':              'wrk_furniture.js',
        'furniture2':             'wrk_furniture2.js',
        'gas':                    'wrk_gas.js',
        'gas_full':               'wrk_gas_full.js',
        'gassupply':              'wrk_gassupply.js',
        'geotech':                'wrk_geotech.js',
        'gkl_full':               'wrk_gkl_full.js',
        'gkl_masonry_facade_roof_ext': 'wrk_gkl_masonry_facade_roof_ext.js',
        'glass':                  'wrk_glass.js',
        'glass2':                 'wrk_glass2.js',
        'greenery':               'wrk_greenery.js',
        'heatfloor':              'wrk_heatfloor.js',
        'heating':                'wrk_heating.js',
        'heating_full':           'wrk_heating_full.js',
        'hvac':                   'wrk_hvac.js',
        'hvac_ext2':              'wrk_hvac_ext2.js',
        'hvac_full':              'wrk_hvac_full.js',
        'hydro':                  'wrk_hydro.js',
        'ind_floors':             'wrk_ind_floors.js',
        'ind_pipes':              'wrk_ind_pipes.js',
        'indfloor':               'wrk_indfloor.js',
        'industrial':             'wrk_industrial.js',
        'industrial_equip':       'wrk_industrial_equip.js',
        'industrial_ext2':        'wrk_industrial_ext2.js',
        'industrial_floors':      'wrk_industrial_floors.js',
        'industrial_spec':        'wrk_industrial_spec.js',
        'industrial2':            'wrk_industrial2.js',
        'indvent':                'wrk_indvent.js',
        'insulation':             'wrk_insulation.js',
        'insulation_all':         'wrk_insulation_all.js',
        'insulation_full':        'wrk_insulation_full.js',
        'insulation_full2':       'wrk_insulation_full2.js',
        'interior_decor':         'wrk_interior_decor.js',
        'irrigation':             'wrk_irrigation.js',
        'jbi':                    'wrk_jbi.js',
        'kitchen':                'wrk_kitchen.js',
        'landscape':              'wrk_landscape.js',
        'landscape_full':         'wrk_landscape_full.js',
        'landscape_full2':        'wrk_landscape_full2.js',
        'landscape_pool_sauna':   'wrk_landscape_pool_sauna.js',
        'low_voltage':            'wrk_low_voltage.js',
        'low_voltage_full':       'wrk_low_voltage_full.js',
        'lowcurrent_full':        'wrk_lowcurrent_full.js',
        'lowvoltage':             'wrk_lowvoltage.js',
        'maintenance':            'wrk_maintenance.js',
        'masonry':                'wrk_masonry.js',
        'masonry_ext':            'wrk_masonry_ext.js',
        'masonry_full':           'wrk_masonry_full.js',
        'masonry_full2':          'wrk_masonry_full2.js',
        'mechanization':          'wrk_mechanization.js',
        'medical_full':           'wrk_medical_full.js',
        'metalwork':              'wrk_metalwork.js',
        'metalwork_full':         'wrk_metalwork_full.js',
        'metalwork_full2':        'wrk_metalwork_full2.js',
        'metalwork2':             'wrk_metalwork2.js',
        'misc_ext':               'wrk_misc_ext.js',
        'modular':                'wrk_modular.js',
        'modular2':               'wrk_modular2.js',
        'monolith_full':          'wrk_monolith_full.js',
        'networks':               'wrk_networks.js',
        'oilgas':                 'wrk_oilgas.js',
        'oilgas_energy_railway':  'wrk_oilgas_energy_railway.js',
        'openings_ext2':          'wrk_openings_ext2.js',
        'openings_full':          'wrk_openings_full.js',
        'outdoor_light':          'wrk_outdoor_light.js',
        'painting':               'wrk_painting.js',
        'painting_full':          'wrk_painting_full.js',
        'parking':                'wrk_parking.js',
        'piling_full':            'wrk_piling_full.js',
        'piping_full':            'wrk_piping_full.js',
        'plaster':                'wrk_plaster.js',
        'plaster_paint_full':     'wrk_plaster_paint_full.js',
        'plaster_plumbing_ext':   'wrk_plaster_plumbing_ext.js',
        'plastering_full':        'wrk_plastering_full.js',
        'plumbing':               'wrk_plumbing.js',
        'plumbing_ext':           'wrk_plumbing_ext.js',
        'plumbing_full':          'wrk_plumbing_full.js',
        'plumbing_full2':         'wrk_plumbing_full2.js',
        'pools':                  'wrk_pools.js',
        'power_supply':           'wrk_power_supply.js',
        'powerlines':             'wrk_powerlines.js',
        'precast':                'wrk_precast.js',
        'precast_full':           'wrk_precast_full.js',
        'prep_works':             'wrk_prep_works.js',
        'protection':             'wrk_protection.js',
        'reconstruction':         'wrk_reconstruction.js',
        'reconstruction2':        'wrk_reconstruction2.js',
        'refrigeration':          'wrk_refrigeration.js',
        'reinforce':              'wrk_reinforce.js',
        'renewable_energy':       'wrk_renewable_energy.js',
        'restoration':            'wrk_restoration.js',
        'restoration2':           'wrk_restoration2.js',
        'road':                   'wrk_road.js',
        'road_full':              'wrk_road_full.js',
        'road_works':             'wrk_road_works.js',
        'roads':                  'wrk_roads.js',
        'roads2':                 'wrk_roads2.js',
        'roof_full':              'wrk_roof_full.js',
        'roofing':                'wrk_roofing.js',
        'roofing_ext':            'wrk_roofing_ext.js',
        'roofing_full':           'wrk_roofing_full.js',
        'roofing_full2':          'wrk_roofing_full2.js',
        'sanitary':               'wrk_sanitary.js',
        'sauna':                  'wrk_sauna.js',
        'screed_leveling':        'wrk_screed_leveling.js',
        'security':               'wrk_security.js',
        'smart_cctv_telecom':     'wrk_smart_cctv_telecom.js',
        'smarthome':              'wrk_smarthome.js',
        'special':                'wrk_special.js',
        'special_ext2':           'wrk_special_ext2.js',
        'special_rooms':          'wrk_special_rooms.js',
        'specworks':              'wrk_specworks.js',
        'sports':                 'wrk_sports.js',
        'sports2':                'wrk_sports2.js',
        'stairs':                 'wrk_stairs.js',
        'stairs2':                'wrk_stairs2.js',
        'steelworks':             'wrk_steelworks.js',
        'techequip':              'wrk_techequip.js',
        'telecom':                'wrk_telecom.js',
        'telecom2':               'wrk_telecom2.js',
        'telecom3':               'wrk_telecom3.js',
        'textiles':               'wrk_textiles.js',
        'tiling':                 'wrk_tiling.js',
        'tiling_floor_ext':       'wrk_tiling_floor_ext.js',
        'tiling_full':            'wrk_tiling_full.js',
        'tunnels':                'wrk_tunnels.js',
        'underground':            'wrk_underground.js',
        'vent_ac_heat_ext':       'wrk_vent_ac_heat_ext.js',
        'ventilation_full':       'wrk_ventilation_full.js',
        'warehouse':              'wrk_warehouse.js',
        'water_ext2':             'wrk_water_ext2.js',
        'water_treatment':        'wrk_water_treatment.js',
        'waterfront':             'wrk_waterfront.js',
        'waterproof':             'wrk_waterproof.js',
        'waterproof_fire_demo':   'wrk_waterproof_fire_demo.js',
        'waterproofing_full':     'wrk_waterproofing_full.js',
        'watertreat':             'wrk_watertreat.js',
        'windows':                'wrk_windows.js',
        'wood_construction':      'wrk_wood_construction.js',
        'woodhouse':              'wrk_woodhouse.js',
        'woodwork':               'wrk_woodwork.js',
        'woodworks':              'wrk_woodworks.js',
    };

    // Маппинг категорий → файлы (mat) — ПОЛНЫЙ список (169 каталогов)
    const MAT_CATALOG_MAP = {
        'aggregates':             'mat_aggregates.js',
        'aircon_catalog':         'mat_aircon_catalog.js',
        'airport_catalog':        'mat_airport_catalog.js',
        'aluminum_catalog':       'mat_aluminum_catalog.js',
        'bathroom':               'mat_bathroom.js',
        'bathroom_catalog':       'mat_bathroom_catalog.js',
        'blocks_catalog':         'mat_blocks_catalog.js',
        'brickext_catalog':       'mat_brickext_catalog.js',
        'brick_catalog':          'mat_brick_catalog.js',
        'brick_full_catalog':     'mat_brick_full_catalog.js',
        'bridges_catalog':        'mat_bridges_catalog.js',
        'bulk_catalog':           'mat_bulk_catalog.js',
        'cables_catalog':         'mat_cables_catalog.js',
        'cabletray_catalog':      'mat_cabletray_catalog.js',
        'cable_catalog':          'mat_cable_catalog.js',
        'ceiling':                'mat_ceiling.js',
        'ceilings_catalog':       'mat_ceilings_catalog.js',
        'ceramictile_catalog':    'mat_ceramictile_catalog.js',
        'chemext_catalog':        'mat_chemext_catalog.js',
        'chemical_catalog':       'mat_chemical_catalog.js',
        'chemistry_catalog':      'mat_chemistry_catalog.js',
        'chimney':                'mat_chimney.js',
        'commercial_catalog':     'mat_commercial_catalog.js',
        'concrete':               'mat_concrete.js',
        'consumables_catalog':    'mat_consumables_catalog.js',
        'doorsext_catalog':       'mat_doorsext_catalog.js',
        'doors_catalog':          'mat_doors_catalog.js',
        'drymix_catalog':         'mat_drymix_catalog.js',
        'drymix_ext':             'mat_drymix_ext.js',
        'drywall':                'mat_drywall.js',
        'drywall_catalog':        'mat_drywall_catalog.js',
        'earthing':               'mat_earthing.js',
        'electrical':             'mat_electrical.js',
        'electric_catalog':       'mat_electric_catalog.js',
        'electroinstall_catalog': 'mat_electroinstall_catalog.js',
        'electro_ext':            'mat_electro_ext.js',
        'elec_panels':            'mat_elec_panels.js',
        'elevator':               'mat_elevator.js',
        'energy_catalog':         'mat_energy_catalog.js',
        'equipment_catalog':      'mat_equipment_catalog.js',
        'facade':                 'mat_facade.js',
        'facade_catalog':         'mat_facade_catalog.js',
        'fasteners':              'mat_fasteners.js',
        'fasteners_catalog':      'mat_fasteners_catalog.js',
        'fasteners_ext':          'mat_fasteners_ext.js',
        'fence_catalog':          'mat_fence_catalog.js',
        'fencing_catalog':        'mat_fencing_catalog.js',
        'fire':                   'mat_fire.js',
        'fireplace_catalog':      'mat_fireplace_catalog.js',
        'firesafety_catalog':     'mat_firesafety_catalog.js',
        'fixings_catalog':        'mat_fixings_catalog.js',
        'floorcover_catalog':     'mat_floorcover_catalog.js',
        'flooring':               'mat_flooring.js',
        'floor_catalog':          'mat_floor_catalog.js',
        'formwork':               'mat_formwork.js',
        'formwork_catalog':       'mat_formwork_catalog.js',
        'furniture_catalog':      'mat_furniture_catalog.js',
        'garage_catalog':         'mat_garage_catalog.js',
        'gardenequip_catalog':    'mat_gardenequip_catalog.js',
        'gas':                    'mat_gas.js',
        'gates_catalog':          'mat_gates_catalog.js',
        'generators_catalog':     'mat_generators_catalog.js',
        'geotextile_catalog':     'mat_geotextile_catalog.js',
        'glass':                  'mat_glass.js',
        'heating':                'mat_heating.js',
        'heatingext_catalog':     'mat_heatingext_catalog.js',
        'heating_catalog':        'mat_heating_catalog.js',
        'hvac':                   'mat_hvac.js',
        'hvac_catalog':           'mat_hvac_catalog.js',
        'hydro_catalog':          'mat_hydro_catalog.js',
        'indfloor_catalog':       'mat_indfloor_catalog.js',
        'ind_floor':              'mat_ind_floor.js',
        'insulation':             'mat_insulation.js',
        'insulation_catalog':     'mat_insulation_catalog.js',
        'interior_catalog':       'mat_interior_catalog.js',
        'jbi_blocks_catalog':     'mat_jbi_blocks_catalog.js',
        'jbi_catalog':            'mat_jbi_catalog.js',
        'jbi_plates_catalog':     'mat_jbi_plates_catalog.js',
        'jbi_special_catalog':    'mat_jbi_special_catalog.js',
        'kitchen':                'mat_kitchen.js',
        'kitchenext_catalog':     'mat_kitchenext_catalog.js',
        'kitchen_catalog':        'mat_kitchen_catalog.js',
        'landscape':              'mat_landscape.js',
        'landscape_catalog':      'mat_landscape_catalog.js',
        'lightingext_catalog':    'mat_lightingext_catalog.js',
        'lighting_catalog':       'mat_lighting_catalog.js',
        'lowvoltage_catalog':     'mat_lowvoltage_catalog.js',
        'low_voltage':            'mat_low_voltage.js',
        'lumber':                 'mat_lumber.js',
        'lumberext_catalog':      'mat_lumberext_catalog.js',
        'lumber_catalog':         'mat_lumber_catalog.js',
        'masonry':                'mat_masonry.js',
        'metal':                  'mat_metal.js',
        'metal_catalog':          'mat_metal_catalog.js',
        'metal_ext':              'mat_metal_ext.js',
        'metiz_catalog':          'mat_metiz_catalog.js',
        'mining_catalog':         'mat_mining_catalog.js',
        'mixes_catalog':          'mat_mixes_catalog.js',
        'oilgas_catalog':         'mat_oilgas_catalog.js',
        'openings_ext':           'mat_openings_ext.js',
        'packaging_catalog':      'mat_packaging_catalog.js',
        'paint':                  'mat_paint.js',
        'paints_catalog':         'mat_paints_catalog.js',
        'painttools_catalog':     'mat_painttools_catalog.js',
        'paint_catalog':          'mat_paint_catalog.js',
        'paint_ext':              'mat_paint_ext.js',
        'paving_catalog':         'mat_paving_catalog.js',
        'pipes_ext':              'mat_pipes_ext.js',
        'pipe_catalog':           'mat_pipe_catalog.js',
        'piping_catalog':         'mat_piping_catalog.js',
        'plaster':                'mat_plaster.js',
        'plumbing':               'mat_plumbing.js',
        'plumbing_catalog':       'mat_plumbing_catalog.js',
        'pool':                   'mat_pool.js',
        'pool_catalog':           'mat_pool_catalog.js',
        'powertools_catalog':     'mat_powertools_catalog.js',
        'ppe_catalog':            'mat_ppe_catalog.js',
        'profiles_catalog':       'mat_profiles_catalog.js',
        'radiatorsext_catalog':   'mat_radiatorsext_catalog.js',
        'radiators_catalog':      'mat_radiators_catalog.js',
        'railway_catalog':        'mat_railway_catalog.js',
        'rebar':                  'mat_rebar.js',
        'rebar_catalog':          'mat_rebar_catalog.js',
        'rental_catalog':         'mat_rental_catalog.js',
        'road':                   'mat_road.js',
        'roofing':                'mat_roofing.js',
        'roofing_catalog':        'mat_roofing_catalog.js',
        'sanitary':               'mat_sanitary.js',
        'sanitaryware_catalog':   'mat_sanitaryware_catalog.js',
        'sanitary_catalog':       'mat_sanitary_catalog.js',
        'sauna':                  'mat_sauna.js',
        'saunaext_catalog':       'mat_saunaext_catalog.js',
        'scaffold_catalog':       'mat_scaffold_catalog.js',
        'screed':                 'mat_screed.js',
        'sealants_catalog':       'mat_sealants_catalog.js',
        'security_catalog':       'mat_security_catalog.js',
        'sewage':                 'mat_sewage.js',
        'sewer_catalog':          'mat_sewer_catalog.js',
        'smarthomeext_catalog':   'mat_smarthomeext_catalog.js',
        'smarthome_catalog':      'mat_smarthome_catalog.js',
        'smart_home':             'mat_smart_home.js',
        'solar':                  'mat_solar.js',
        'solarext_catalog':       'mat_solarext_catalog.js',
        'soundproof':             'mat_soundproof.js',
        'soundproof_catalog':     'mat_soundproof_catalog.js',
        'special':                'mat_special.js',
        'special_catalog':        'mat_special_catalog.js',
        'stairsext_catalog':      'mat_stairsext_catalog.js',
        'steelprofile_catalog':   'mat_steelprofile_catalog.js',
        'steel_struct':           'mat_steel_struct.js',
        'stone':                  'mat_stone.js',
        'tile_catalog':           'mat_tile_catalog.js',
        'tiling':                 'mat_tiling.js',
        'timber_catalog':         'mat_timber_catalog.js',
        'tools':                  'mat_tools.js',
        'tools_catalog':          'mat_tools_catalog.js',
        'ventduct_catalog':       'mat_ventduct_catalog.js',
        'vent_catalog':           'mat_vent_catalog.js',
        'wallpanels_catalog':     'mat_wallpanels_catalog.js',
        'warmfloor_catalog':      'mat_warmfloor_catalog.js',
        'waterproof':             'mat_waterproof.js',
        'watersystem_catalog':    'mat_watersystem_catalog.js',
        'water_catalog':          'mat_water_catalog.js',
        'water_supply':           'mat_water_supply.js',
        'welding_catalog':        'mat_welding_catalog.js',
        'windows':                'mat_windows.js',
        'windowsext_catalog':     'mat_windowsext_catalog.js',
        'windows_catalog':        'mat_windows_catalog.js',
        'windows_doors':          'mat_windows_doors.js',
        'wood_protect':           'mat_wood_protect.js'
    };

    // Маппинг категорий → файлы (eq) — Техника и оборудование (5 каталогов)
    const EQ_CATALOG_MAP = {
        'electrical':       'eq_electrical.js',
        'garden_other':     'eq_garden_other.js',
        'heavy_equipment':  'eq_heavy_equipment.js',
        'hvac_plumbing':    'eq_hvac_plumbing.js',
        'power_tools':      'eq_power_tools.js'
    };

    /**
     * Загрузить один JS-файл через <script>
     * @param {string} src — путь к файлу
     * @returns {Promise<void>}
     */
    function loadScript(src) {
        if (_loaded.has(src)) return Promise.resolve();
        if (_loading.has(src)) return _loading.get(src);

        const promise = new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = src;
            script.async = true;
            script.onload = () => {
                _loaded.add(src);
                _loading.delete(src);
                resolve();
            };
            script.onerror = () => {
                _loading.delete(src);
                reject(new Error(`Failed to load: ${src}`));
            };
            document.head.appendChild(script);
        });

        _loading.set(src, promise);
        return promise;
    }

    /**
     * Загрузить каталог работ по категории
     * @param {string} category — ключ категории (например 'balcony')
     * @returns {Promise<object|null>} — данные каталога
     */
    async function loadWorkCatalog(category) {
        const file = WRK_CATALOG_MAP[category];
        if (!file) {
            console.warn(`[CatalogLoader] Unknown work category: ${category}`);
            return null;
        }

        try {
            await loadScript(_basePath + file);
            // Данные доступны через window.AI_WRK_*
            const key = `AI_WRK_${category.toUpperCase()}`;
            return window[key] || null;
        } catch (e) {
            console.error(`[CatalogLoader] Failed to load work catalog '${category}':`, e);
            return null;
        }
    }

    /**
     * Загрузить каталог материалов по категории
     * @param {string} category
     * @returns {Promise<object|null>}
     */
    async function loadMaterialCatalog(category) {
        const file = MAT_CATALOG_MAP[category];
        if (!file) {
            console.warn(`[CatalogLoader] Unknown material category: ${category}`);
            return null;
        }

        try {
            await loadScript(_basePath + file);
            const key = `AI_MAT_${category.toUpperCase()}`;
            return window[key] || null;
        } catch (e) {
            console.error(`[CatalogLoader] Failed to load material catalog '${category}':`, e);
            return null;
        }
    }

    /**
     * Загрузить каталог техники/оборудования по категории
     * @param {string} category
     * @returns {Promise<object|null>}
     */
    async function loadEquipmentCatalog(category) {
        const file = EQ_CATALOG_MAP[category];
        if (!file) {
            console.warn(`[CatalogLoader] Unknown equipment category: ${category}`);
            return null;
        }

        try {
            await loadScript(_basePath + file);
            const key = `AI_EQ_${category.toUpperCase()}`;
            return window[key] || null;
        } catch (e) {
            console.error(`[CatalogLoader] Failed to load equipment catalog '${category}':`, e);
            return null;
        }
    }

    /**
     * Загрузить несколько каталогов параллельно
     * @param {string[]} categories — массив категорий
     * @param {string} type — 'work', 'material' или 'equipment'
     * @returns {Promise<object>} — объединённый каталог
     */
    async function loadMultiple(categories, type = 'work') {
        const loader = type === 'work' ? loadWorkCatalog
                     : type === 'equipment' ? loadEquipmentCatalog
                     : loadMaterialCatalog;
        const results = await Promise.allSettled(categories.map(c => loader(c)));
        const merged = {};

        results.forEach((r, i) => {
            if (r.status === 'fulfilled' && r.value) {
                Object.assign(merged, r.value);
            }
        });

        console.log(`[CatalogLoader] ✅ Loaded ${type} catalogs: ${categories.join(', ')} (${Object.keys(merged).length} items)`);
        return merged;
    }

    /**
     * Предзагрузить ВСЕ каталоги (работы + материалы + техника)
     */
    async function preloadCommon() {
        console.log('[CatalogLoader] 🔄 Preloading ALL catalogs (works + materials + equipment)...');
        await loadAll();
    }

    /**
     * Получить список доступных категорий
     */
    function getAvailableCategories() {
        return {
            work: Object.keys(WRK_CATALOG_MAP),
            material: Object.keys(MAT_CATALOG_MAP),
            equipment: Object.keys(EQ_CATALOG_MAP)
        };
    }

    /**
     * Статистика загрузки
     */
    function getStats() {
        return {
            loaded: _loaded.size,
            loading: _loading.size,
            totalWork: Object.keys(WRK_CATALOG_MAP).length,
            totalMaterial: Object.keys(MAT_CATALOG_MAP).length,
            totalEquipment: Object.keys(EQ_CATALOG_MAP).length
        };
    }

    /**
     * Загрузить ВСЕ каталоги (работы + материалы + техника)
     * @returns {Promise<number>} — количество загруженных элементов
     */
    let _allLoaded = false;

    async function loadAll() {
        if (_allLoaded) return 0;

        const wrkCategories = Object.keys(WRK_CATALOG_MAP);
        const matCategories = Object.keys(MAT_CATALOG_MAP);
        const eqCategories = Object.keys(EQ_CATALOG_MAP);
        const totalFiles = wrkCategories.length + matCategories.length + eqCategories.length;

        console.log(`[CatalogLoader] 🔄 Loading ALL ${totalFiles} catalogs (${wrkCategories.length} wrk + ${matCategories.length} mat + ${eqCategories.length} eq)...`);

        // Загружаем все три типа параллельно
        const [wrkResults, matResults, eqResults] = await Promise.all([
            Promise.allSettled(wrkCategories.map(cat => loadWorkCatalog(cat))),
            Promise.allSettled(matCategories.map(cat => loadMaterialCatalog(cat))),
            Promise.allSettled(eqCategories.map(cat => loadEquipmentCatalog(cat)))
        ]);

        let totalItems = 0;
        let loadedWrk = 0, loadedMat = 0, loadedEq = 0;

        wrkResults.forEach(r => {
            if (r.status === 'fulfilled' && r.value) {
                loadedWrk++;
                totalItems += Object.keys(r.value).length;
            }
        });

        matResults.forEach(r => {
            if (r.status === 'fulfilled' && r.value) {
                loadedMat++;
                totalItems += Object.keys(r.value).length;
            }
        });

        eqResults.forEach(r => {
            if (r.status === 'fulfilled' && r.value) {
                loadedEq++;
                totalItems += Object.keys(r.value).length;
            }
        });

        _allLoaded = true;

        // Invalidate WorkRegistry cache so it rescans
        if (window.WorkRegistry && window.WorkRegistry.invalidateCache) {
            window.WorkRegistry.invalidateCache();
        }

        const loadedTotal = loadedWrk + loadedMat + loadedEq;
        console.log(`[CatalogLoader] ✅ ALL loaded: ${loadedTotal}/${totalFiles} catalogs (🔧${loadedWrk} wrk, 🧱${loadedMat} mat, 🚜${loadedEq} eq) — ${totalItems} items total`);

        // Dispatch event so modules know catalogs are ready
        document.dispatchEvent(new CustomEvent('catalogs:ready', {
            detail: {
                catalogs: loadedTotal,
                items: totalItems,
                works: loadedWrk,
                materials: loadedMat,
                equipment: loadedEq
            }
        }));

        return totalItems;
    }

    function isReady() {
        return _allLoaded;
    }

    // ========== ЭКСПОРТ ==========
    window.CatalogLoader = {
        loadWork: loadWorkCatalog,
        loadMaterial: loadMaterialCatalog,
        loadEquipment: loadEquipmentCatalog,
        loadMultiple,
        preloadCommon,
        loadAll,
        isReady,
        getCategories: getAvailableCategories,
        getStats,
        // Direct maps for advanced usage
        WRK_MAP: WRK_CATALOG_MAP,
        MAT_MAP: MAT_CATALOG_MAP,
        EQ_MAP: EQ_CATALOG_MAP
    };

    console.log(`[CatalogLoader] ✅ Module loaded (${Object.keys(WRK_CATALOG_MAP).length} wrk + ${Object.keys(MAT_CATALOG_MAP).length} mat + ${Object.keys(EQ_CATALOG_MAP).length} eq categories available)`);
})();
