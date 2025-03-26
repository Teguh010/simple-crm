import { computed, type ComputedRef } from 'vue'
import useCliCommonStore from '@/stores/cli-common'
import { type CliCommon } from '@/types/types'

interface MemoCarteHookType {
  getMemoCarteBgColor: ComputedRef<(memoCarte: { id_cli_common: number | null }) => string>
  getMemoCarteLabel: ComputedRef<(memoCarte: { id_cli_common: number | null }) => string>
}

export function useMemoCarte (): MemoCarteHookType {
  const cliCommonStore = useCliCommonStore()

  const getMemoCarteBgColor = computed(
    () => (memoCarte: { id_cli_common: number | null }) => {
      const cli = cliCommonStore.getCliCommonOptionList.find(
        (v: CliCommon) => v.id_cli_common === memoCarte?.id_cli_common
      )
      return cli?.text1 ?? 'memo-carte'
    }
  )

  const getMemoCarteLabel = computed(
    () => (memoCarte: { id_cli_common: number | null }) => {
      const cli = cliCommonStore.getCliCommonOptionList.find(
        (v: CliCommon) => v.id_cli_common === memoCarte?.id_cli_common
      )
      return cli?.name_cli_common ?? ''
    }
  )

  return {
    getMemoCarteBgColor,
    getMemoCarteLabel
  }
}
