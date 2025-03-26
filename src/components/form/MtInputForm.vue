<template>
  <template v-if="type == 'text'">
    <q-input
      ref="textRef"
      :readonly="readonly"
      :borderless="borderless"
      :outlined="outlined"
      :bgColor="bgColor"
      dense
      :autofocus="autofocus"
      :model-value="modelValue"
      :label="label"
      :tabindex="tabindex"
      @update:model-value="changeValueData"
      :placeholder="placeholder"
      :lazy-rules="lazyRules"
      :rules="rules"
      :disable="disable"
      :pattern="pattern"
      :color="color"
      :label-color="labelColor"
      class="q-pa-none"
      @keypress="keyPress"
      @keydown="keydown"
      v-bind="$attrs"
      :autogrow="autogrow"
      v-katakana="isKatakana"
      :class="[requiredClass]"
      :input-style="{ paddingLeft: '6px', ...inputStyle }"
      :error="isError"
    >
      <template v-if="iconPrepend" v-slot:prepend>
        <q-icon size="18px" :name="iconPrepend" />
      </template>
      <template v-if="iconAppend" v-slot:append>
        <q-icon size="18px" :name="iconAppend" />
      </template>
      <template v-else-if="buttonAppend" v-slot:append>
        <q-btn
          outline
          class="bg-grey-300 text-grey-800"
          padding="1px 2px"
          unelevated
          @click="handleBtnClick"
        >
          <span>{{ buttonAppend }}</span>
        </q-btn>
      </template>
      <template v-slot:append>
        <slot name="append" />
      </template>
      <template v-slot:error>
        <slot name="error" />
      </template>
    </q-input>
  </template>

  <template v-if="type == 'number'">
    <q-input
      :readonly="readonly"
      type="number"
      :outlined="outlined"
      :bgColor="bgColor"
      dense
      :autofocus="autofocus"
      step="any"
      :model-value="modelValue"
      :label="label"
      :tabindex="tabindex"
      @update:model-value="changeValueData"
      @keydown="keydown"
      :placeholder="placeholder"
      :lazy-rules="lazyRules"
      :rules="rules"
      :disable="disable"
      :pattern="pattern"
      :color="color"
      :label-color="labelColor"
      class="q-pa-none"
      :class="[classStyle, requiredClass]"
      v-bind="$attrs"
      :autogrow="autogrow"
      :input-style="{ paddingLeft: '6px', ...inputStyle }"
    >
      <template v-if="iconPrepend" v-slot:prepend>
        <q-icon size="18px" :name="iconPrepend" />
      </template>
      <template v-if="iconAppend" v-slot:append>
        <q-icon size="18px" :name="iconAppend" />
      </template>
      <template v-slot:append>
        <slot name="append" />
      </template>
    </q-input>
  </template>

  <template v-else-if="type == 'radio'">
    <q-radio
      :size="size"
      v-for="(item, key) in items"
      :key="key"
      :model-value="modelValue"
      :tabindex="tabindex"
      @update:model-value="changeValueData"
      :val="item.value"
      :label="item.label"
      :rules="rules"
      :lazy-rules="lazyRules"
      :disable="disable"
      class="q-mr-md"
      :class="item?.className ?? classRadio"
      v-bind="$attrs"
    />
  </template>

  <template v-else-if="type == 'checkbox'">
    <q-checkbox
      :size="size"
      class="q-mr-md"
      v-for="(item, key) in items"
      :key="key"
      :model-value="modelValue"
      :tabindex="tabindex"
      :val="item.value"
      :label="item.label"
      :disable="disable"
      :class="classStyle"
      :left-label="leftLabel"
      @update:model-value="changeValueData"
      @click="click"
    />
  </template>

  <template v-else-if="type == 'date'">
    <q-input
      :readonly="readonly"
      :model-value="modelValue"
      :tabindex="tabindex"
      @update:model-value="changeValueData"
      mask="####/##/##"
      dense
      :label="label"
      :rules="rules"
      :lazy-rules="lazyRules"
      :disable="disable"
      :class="classStyle"
      :pattern="pattern"
      :outlined="outlined"
      :color="color"
      v-bind="$attrs"
      :input-style="{ paddingLeft: '6px' }"
    >
      <template v-slot:append>
        <q-icon
          size="18px"
          name="date_range"
          class="cursor-pointer text-grey-500"
        >
          <q-popup-proxy
            ref="datePopup"
            cover
            transition-show="scale"
            transition-hide="scale"
          >
            <q-date
              minimal
              mask="YYYY/MM/DD"
              :model-value="modelValue"
              :tabindex="tabindex"
              @update:model-value="
                changeValueData($event), $refs.datePopup.hide()
              "
            />
          </q-popup-proxy>
        </q-icon>
      </template>
    </q-input>
  </template>

  <template v-else-if="type == 'datetime'">
    <q-input
      :readonly="readonly"
      :model-value="modelValue"
      :tabindex="tabindex"
      @update:model-value="changeValueData"
      :mask="mask ?? '####/##/## ##:##:00'"
      dense
      :label="label"
      :rules="rules"
      :disable="disable"
      @focus="datePopup.show()"
      :class="classStyle"
      :pattern="pattern"
      :color="color"
      v-bind="$attrs"
    >
      <template v-slot:prepend>
        <q-icon
          size="18px"
          name="date_range"
          class="cursor-pointer text-grey-500"
        >
          <q-popup-proxy
            ref="datePopup"
            cover
            transition-show="scale"
            transition-hide="scale"
          >
            <q-date
              :model-value="modelValue"
              :tabindex="tabindex"
              @update:model-value="changeValueData"
              mask="YYYY/MM/DD HH:mm:ss"
            />
          </q-popup-proxy>
        </q-icon>
      </template>
      <template v-slot:append>
        <q-icon
          size="18px"
          name="access_time"
          class="cursor-pointer text-grey-500"
        >
          <q-popup-proxy cover transition-show="scale" transition-hide="scale">
            <q-time
              :model-value="modelValue"
              :tabindex="tabindex"
              @update:model-value="changeValueData"
              mask="YYYY/MM/DD HH:mm:ss"
              format24h
            >
              <div class="row items-center justify-end">
                <q-btn v-close-popup label="Close" color="primary" flat />
              </div>
            </q-time>
          </q-popup-proxy>
        </q-icon>
      </template>
    </q-input>
  </template>

  <div v-else-if="type == 'selection'" :class="styling">
    <div class="col-12">
      <q-select
        :readonly="readonly"
        :outlined="outlined"
        dense
        :model-value="modelValue"
        :label="label"
        :multiple="multiple"
        stack-label
        :tabindex="tabindex"
        :use-input="modelValue ? false : true"
        @filter="filterFn"
        :options="options"
        :placeholder="placeholder"
        :lazy-rules="lazyRules"
        :rules="rules"
        :option-label="optionLabel"
        :option-value="storeLabel ? { optionValue, optionLabel } : optionValue"
        emit-value
        map-options
        :color="color"
        :bgColor="bgColor"
        :disable="disable"
        class="q-pa-none clear-icon"
        :class="$q.screen.lt.sm ? 'col' : 'recruitment-select'"
        ref="MtInputFormRef"
        v-bind="$attrs"
      >
        <template v-if="iconPrepend" v-slot:prepend>
          <q-icon size="18px" :name="iconPrepend" />
        </template>
        <template #append>
          <div v-if="modelValue && !readonly" class="flex justify-end">
            <q-btn flat icon="cancel" @click.stop="changeValueData(null)">
            </q-btn>
          </div>
        </template>
        <template v-if="iconAppend" v-slot:append>
          <q-icon size="18px" :name="iconAppend" />
        </template>
        <template v-slot:after v-if="after">
          <span class="people">{{ after }}</span>
        </template>
        <template v-slot:no-option>
          <q-item>
            <q-item-section class="text-grey"> No results </q-item-section>
          </q-item>
        </template>
      </q-select>
    </div>
  </div>

  <template v-if="type == 'textarea'">
    <q-input
      ref="textArea"
      :autogrow="autogrow"
      :borderless="borderless"
      :outlined="outlined"
      :bgColor="bgColor"
      type="textarea"
      :model-value="modelValue"
      :tabindex="tabindex"
      @update:model-value="changeValueData"
      :placeholder="placeholder"
      lazy-rules
      :rules="rules"
      :disable="disable"
      :input-class="classStyle"
      v-bind="$attrs"
      :label="label"
      :readonly="readonly"
      :input-style="{ paddingLeft: '6px', ...inputStyle }"
    >
      <template v-slot:append>
        <slot name="append" />
      </template>
    </q-input>
  </template>

  <template v-else-if="type == 'optiongroup'">
    <q-option-group
      class="q-mr-md"
      :model-value="modelValue"
      @update:model-value="changeValueData"
      :options="optionGroupOptions"
      color="primary"
      inline
      :type="optionType"
      :size="size"
      :disable="disable"
    />
  </template>
</template>
<script lang="ts">
import { defineComponent, ref } from 'vue'

export default defineComponent({
  name: 'MtInputForm',
  emits: ['click', 'update:model-value', 'updatedValue'],
  methods: {
    async changeValueData(value) {
      // If Input has JP number then replace for JP into EN values.
      if (this.accept == 'number') {
        value = this.toHalf(value)
        await this.$nextTick()
      }

      this.$emit('update:model-value', value)
      this.$emit('updatedValue', value)
    },
    validate(): boolean {
      return this.$refs?.textRef.validate()
    },
    toHalf(value: any) {
      let numStr = ''
      if (value.length && value.length > 0) {
        //文字列の場合
        for (var i = 0; i < value.length; i++) {
          let target = value.charAt(i)
          //全角を半角に変える
          switch (target) {
            case '0':
            case '０':
              numStr += '0'
              break
            case '1':
            case '１':
              numStr += '1'
              break
            case '2':
            case '２':
              numStr += '2'
              break
            case '3':
            case '３':
              numStr += '3'
              break
            case '4':
            case '４':
              numStr += '4'
              break
            case '5':
            case '５':
              numStr += '5'
              break
            case '6':
            case '６':
              numStr += '6'
              break
            case '7':
            case '７':
              numStr += '7'
              break
            case '8':
            case '８':
              numStr += '8'
              break
            case '9':
            case '９':
              numStr += '9'
              break
            case '.':
            case '．':
              numStr += '.'
              break
            case '。':
              numStr += '.'
              break
            case '-':
            case 'ー':
              numStr += '-'
              break
            case '―':
              numStr += '-'
              break
            case '−':
              numStr += '-'
              break
            case '－':
              numStr += '-'
              break
            default:
          }
        }

        return Number(numStr)
      } else {
        //数字の場合
        return value
      }
    },
    keyPress(e) {
      if (this.type == 'number' || this.accept == 'number') {
        var charCode = e.which ?? e.keyCode
        if (
          (charCode > 31 && (charCode < 48 || charCode > 57)) ||
          [43, 45].includes(charCode)
        ) {
          e.preventDefault()
        }
      }
    },
    keydown(event) {
      if (event.key === 'Enter' && !Boolean(this.autogrow)) {
        if (event.target.getAttribute('tabindex')) {
          var tabIndex = Number(event.target.getAttribute('tabindex'))
          if (tabIndex) {
            // check within the current page/model elements, instead of previous loaded elements
            var parentDiv = this.findClosestParentWithId(
              event.target,
              'parentID'
            )

            if (!parentDiv) {
              parentDiv = document
            }

            let countTraverse = 0
            for (var i = 0; ; i++) {
              ++countTraverse
              ++tabIndex
              var nextFoucusTarget = parentDiv.querySelector(
                `[tabindex="${tabIndex}"]`
              )
              if (nextFoucusTarget) {
                let isReadonly = nextFoucusTarget.readOnly
                let isDisable = nextFoucusTarget.disabled
                if (
                  !isDisable &&
                  (!isReadonly ||
                    nextFoucusTarget.getAttribute('aria-readonly') == 'false')
                ) {
                  nextFoucusTarget.focus()
                  break
                }
              }
              if (countTraverse >= 1000) {
                break
              }
            }
          }
        }
        event.preventDefault() // Prevented other actions
      }
    },
    filterFn(val, update) {
      if (val === '') {
        update(() => {
          // Reset options to the original array from props
          this.options = [...this.items]
        })
        return
      }

      update(() => {
        const needle = val.toLowerCase()
        // Filter options based on the filter value
        this.options = this.items.filter((v) => {
          return v.label.toLowerCase().indexOf(needle) > -1
        })
      })
    },
    click() {
      this.$emit('click')
    },
    findClosestParentWithId(element, parentId) {
      if (!document.getElementById(parentId)) {
        return null
      }

      while (element) {
        if (element.id === parentId) {
          return element
        }
        element = element.parentElement
      }
      return null
    }
  },
  computed: {
    requiredClass() {
      return this.required &&
        (!this.modelValue || this.modelValue.toString().trim() === '')
        ? 'bg-accent-050'
        : ''
    }
  },
  data() {
    return {
      datePopup: ref(null),
      options: ref(this.items)
    }
  },
  props: {
    inputDateRef: ref(),
    modelValue: {
      type: [String, Boolean, Array, Object, Number],
      default: undefined
    },
    items: {
      type: [Array, Object]
    },
    type: String,
    accept: String,
    placeholder: String,
    label: String,
    subtitle: String,
    rules: Array,
    // use tabindex sequentially (0, 1, 2, 3, etc) to move between elements in sequential order
    // if needed to skip an element, use higher tabindex number (10, 20, etc)
    tabindex: Number | String,
    required: {
      type: Boolean,
      default: false
    },
    not_required: {
      type: Boolean,
      default: false
    },
    isKatakana: {
      type: Boolean,
      default: false
    },
    multiple: {
      type: Boolean,
      default: false
    },
    useInput: {
      type: Boolean,
      default: false
    },
    lazyRules: {
      type: Boolean,
      default: null
    },
    optionLabel: {
      type: String,
      default: 'label'
    },
    optionValue: {
      type: String
    },
    after: String,
    disable: {
      type: Boolean,
      default: false
    },
    pattern: {
      type: String,
      default: null
    },
    outlined: {
      type: Boolean,
      default: false
    },
    bgColor: {
      type: String,
      default: ''
    },
    color: {
      type: String,
      default: 'blue'
    },
    labelColor: {
      type: String,
      default: ''
    },
    classStyle: {
      type: String,
      default: ''
    },
    classRadio: {
      type: String,
      default: ''
    },
    size: {
      type: String,
      default: '28px'
    },
    iconPrepend: {
      type: String,
      default: null
    },
    iconAppend: {
      type: String,
      default: null
    },
    autogrow: {
      type: Boolean,
      default: false
    },
    autofocus: {
      type: Boolean,
      default: false
    },
    styling: {
      type: String,
      default: ''
    },
    storeLabel: {
      type: Boolean,
      default: false
    },
    mask: {
      type: String,
      default: null
    },
    borderless: {
      type: Boolean,
      default: false
    },
    leftLabel: {
      type: Boolean,
      default: false
    },
    readonly: {
      type: Boolean,
      default: false
    },
    handleBtnClick: {
      type: Function,
      default: null
    },
    buttonAppend: {
      type: String,
      default: null
    },
    inputStyle: {
      type: Object,
      default: null
    },
    // optiongroup type props
    optionGroupOptions: {
      type: Array,
      default: []
    },
    optionType: String,
    isError: {
      type: Boolean,
      default: false
    }
  }
})
</script>

<style lang="scss" scoped>
.clear-icon {
  :deep(button) {
    padding: 0;
    opacity: 0.6;
    background: transparent;
    &:hover {
      opacity: 1;
      background-image: unset !important;
    }
    .q-focus-helper {
      background: unset !important;
    }
    .q-icon {
      font-size: 1.125rem;
      top: 1px;
    }
  }
}
</style>
