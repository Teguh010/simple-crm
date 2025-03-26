import { ref, computed } from 'vue'
import { ItemServiceUnit } from '@/types'
import mtUtils from '@/utils/mtUtils'
import selectOptions from '@/utils/selectOptions'
import { isConvertibleToNumber } from '@/utils/typeGuards'

/**
 * Composable for managing item service unit selection and data
 * 
 * @returns {Object} Item service unit utilities
 * @property {Ref<ItemServiceUnit[]>} itemServiceUnits - Array of fetched item service units
 * @property {Ref<ItemServiceUnit|undefined>} itemServiceUnitDefault - Default selected unit
 * @property {Ref<boolean>} isLoading - Loading state indicator
 * @property {Ref<ItemServiceUnit|undefined>} selectedItemServiceUnit - Currently selected unit
 * @property {(params: {[key: string]: number}) => Promise<ItemServiceUnit[]>} fetchItemServiceUnits - Fetches item service units
 * @property {ComputedRef<{value: string, label: string}[]>} itemServiceUnitAsOptions - Units formatted as select options
 * @property {(id: string) => void} setSelectedItemServiceUnit - Sets the selected unit by ID
 * 
 * @example
 * ```ts
 * const { 
 *   itemServiceUnits,
 *   selectedItemServiceUnit,
 *   fetchItemServiceUnits,
 *   itemServiceUnitAsOptions,
 *   setSelectedItemServiceUnit 
 * } = useItemServiceOption()
 * 
 * // Fetch units for item service ID 123
 * await fetchItemServiceUnits({ id_item_service: 123 })
 * 
 * // Access fetched units
 * console.log(itemServiceUnits.value)
 * 
 * // Get units as select options
 * const options = itemServiceUnitAsOptions.value
 * 
 * // Select a unit by ID
 * setSelectedItemServiceUnit('456')
 * ```
 */
export function useItemServiceOption() {
    const itemServiceUnits = ref<ItemServiceUnit[]>([])
    const itemServiceUnitDefault = ref<ItemServiceUnit | undefined>()
    const isLoading = ref<boolean>(false)
    const selectedItemServiceUnit = ref<ItemServiceUnit | undefined>()

    /**
     * Fetches item service units for a given item service ID
     * @param id - The ID of the item service to fetch units for
     * @returns Promise resolving to array of ItemServiceUnit objects
     * @throws Error if API call fails
     */
    const fetchItemServiceUnits = async (params: { [key: ItemServiceUnit['id_item_service' | 'id_item_service_unit']]: number }) => {
        isLoading.value = true
        try {
            const response = await mtUtils.callApi(selectOptions.reqMethod.GET, '/mst/item_service_units', params)

            itemServiceUnits.value = response
            // Set selected unit to first unit if available, otherwise undefined
            itemServiceUnitDefault.value = response.length > 0 ? response[0] : undefined

            return response
        } catch (error) {
            itemServiceUnits.value = []
            itemServiceUnitDefault.value = undefined
            mtUtils.alert((error as Error).message ?? 'An unknown error occurred', "Error!")
            return []
        } finally {
            isLoading.value = false
        }
    }

    /**
     * Converts itemServiceUnits to select options format
     * @returns Array of objects with value and label properties
     */
    const itemServiceUnitAsOptions = computed(() => {
        return itemServiceUnits.value.map(unit => ({
            value: unit.id_item_service_unit.toString(),
            label: unit.name_service_item_unit
        }))
    })

    /**
     * Sets the selected item service unit based on the provided ID
     * @param {string} id - The ID of the item service unit to select 
     */
    const setSelectedItemServiceUnit = (id: string) => {
        if (!id || !isConvertibleToNumber(id)) {
            selectedItemServiceUnit.value = undefined
            return
        }
        selectedItemServiceUnit.value = itemServiceUnits.value.find(unit => unit.id_item_service_unit === Number(id))
    }

    return {
        itemServiceUnits,
        itemServiceUnitDefault,
        fetchItemServiceUnits,
        isLoading,
        itemServiceUnitAsOptions,
        selectedItemServiceUnit,
        setSelectedItemServiceUnit
    }
}
