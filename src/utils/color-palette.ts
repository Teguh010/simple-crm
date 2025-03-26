import { keyBy } from 'lodash'

export const colorPaletteList = [
//   {
//     label: 'red ',
//     value: 'red ',
//     size: '25px',
//     name: 'circle',
//     color: 'red ',
//     hexValue: '#F44336'
//   },
  {
    label: 'red-1',
    value: 'red-1',
    size: '25px',
    name: 'circle',
    color: 'red-1',
    hexValue: '#FFEBEE'
},
{
    label: 'red-2',
    value: 'red-2',
    size: '25px',
    name: 'circle',
    color: 'red-2',
    hexValue: '#FFCDD2'
},
{
    label: 'red-3',
    value: 'red-3',
    size: '25px',
    name: 'circle',
    color: 'red-3',
    hexValue: '#EF9A9A'
  },
  {
    label: 'red-4',
    value: 'red-4',
    size: '25px',
    name: 'circle',
    color: 'red-4',
    hexValue: '#E57373'
  },
  {
    label: 'red-5',
    value: 'red-5',
    size: '25px',
    name: 'circle',
    color: 'red-5',
    hexValue: '#EF5350'
  },
  {
    label: 'red-6',
    value: 'red-6',
    size: '25px',
    name: 'circle',
    color: 'red-6',
    hexValue: '#F44336'
  },
  {
    label: 'red-7',
    value: 'red-7',
    size: '25px',
    name: 'circle',
    color: 'red-7',
    hexValue: '#E53935'
  },
  {
    label: 'red-8',
    value: 'red-8',
    size: '25px',
    name: 'circle',
    color: 'red-8',
    hexValue: '#D32F2F'
  },
  {
    label: 'red-9',
    value: 'red-9',
    size: '25px',
    name: 'circle',
    color: 'red-9',
    hexValue: '#C62828'
  },
  {
    label: 'red-10',
    value: 'red-10',
    size: '25px',
    name: 'circle',
    color: 'red-10',
    hexValue: '#B71C1C'
  },
  {
    label: 'red-11',
    value: 'red-11',
    size: '25px',
    name: 'circle',
    color: 'red-11',
    hexValue: '#FF8A80'
  },
  {
    label: 'red-12',
    value: 'red-12',
    size: '25px',
    name: 'circle',
    color: 'red-12',
    hexValue: '#FF5252'
  },
  {
    label: 'red-13',
    value: 'red-13',
    size: '25px',
    name: 'circle',
    color: 'red-13',
    hexValue: '#FF1744'
  },
  {
    label: 'red-14',
    value: 'red-14',
    size: '25px',
    name: 'circle',
    color: 'red-14',
    hexValue: '#D50000'
  },
//   {
//     label: 'pink',
//     value: 'pink',
//     size: '25px',
//     name: 'circle',
//     color: 'pink',
//     hexValue: '#'
//   },
  {
    label: 'pink-1',
    value: 'pink-1',
    size: '25px',
    name: 'circle',
    color: 'pink-1',
    hexValue: '#FCE4EC'
  },
  {
    label: 'pink-2',
    value: 'pink-2',
    size: '25px',
    name: 'circle',
    color: 'pink-2',
    hexValue: '#F8BBD0'
  },
  {
    label: 'pink-3',
    value: 'pink-3',
    size: '25px',
    name: 'circle',
    color: 'pink-3',
    hexValue: '#F48FB1'
  },
  {
    label: 'pink-4',
    value: 'pink-4',
    size: '25px',
    name: 'circle',
    color: 'pink-4',
    hexValue: '#F06292'
  },
  {
    label: 'pink-5',
    value: 'pink-5',
    size: '25px',
    name: 'circle',
    color: 'pink-5',
    hexValue: '#EC407A'
  },
  {
    label: 'pink-6',
    value: 'pink-6',
    size: '25px',
    name: 'circle',
    color: 'pink-6',
    hexValue: '#E91E63'
  },
  {
    label: 'pink-7',
    value: 'pink-7',
    size: '25px',
    name: 'circle',
    color: 'pink-7',
    hexValue: '#D81B60'
  },
  {
    label: 'pink-8',
    value: 'pink-8',
    size: '25px',
    name: 'circle',
    color: 'pink-8',
    hexValue: '#C2185B'
  },
  {
    label: 'pink-9',
    value: 'pink-9',
    size: '25px',
    name: 'circle',
    color: 'pink-9',
    hexValue: '#AD1457'
  },
  {
    label: 'pink-10',
    value: 'pink-10',
    size: '25px',
    name: 'circle',
    color: 'pink-10',
    hexValue: '#880E4F'
  },
  {
    label: 'pink-11',
    value: 'pink-11',
    size: '25px',
    name: 'circle',
    color: 'pink-11',
    hexValue: '#FF80AB'
  },
  {
    label: 'pink-12',
    value: 'pink-12',
    size: '25px',
    name: 'circle',
    color: 'pink-12',
    hexValue: '#FF4081'
  },
  {
    label: 'pink-13',
    value: 'pink-13',
    size: '25px',
    name: 'circle',
    color: 'pink-13',
    hexValue: '#F50057'
  },
  {
    label: 'pink-14',
    value: 'pink-14',
    size: '25px',
    name: 'circle',
    color: 'pink-14',
    hexValue: '#C51162'
  },
//   {
//     label: 'purple',
//     value: 'purple',
//     size: '25px',
//     name: 'circle',
//     color: 'purple',
//     hexValue: '#'
//   },
  {
    label: 'purple-1',
    value: 'purple-1',
    size: '25px',
    name: 'circle',
    color: 'purple-1',
    hexValue: '#F3E5F5'
  },
  {
    label: 'purple-2',
    value: 'purple-2',
    size: '25px',
    name: 'circle',
    color: 'purple-2',
    hexValue: '#E1BEE7'
  },
  {
    label: 'purple-3',
    value: 'purple-3',
    size: '25px',
    name: 'circle',
    color: 'purple-3',
    hexValue: '#CE93D8'
  },
  {
    label: 'purple-4',
    value: 'purple-4',
    size: '25px',
    name: 'circle',
    color: 'purple-4',
    hexValue: '#BA68C8'
  },
  {
    label: 'purple-5',
    value: 'purple-5',
    size: '25px',
    name: 'circle',
    color: 'purple-5',
    hexValue: '#AB47BC'
  },
  {
    label: 'purple-6',
    value: 'purple-6',
    size: '25px',
    name: 'circle',
    color: 'purple-6',
    hexValue: '#9C27B0'
  },
  {
    label: 'purple-7',
    value: 'purple-7',
    size: '25px',
    name: 'circle',
    color: 'purple-7',
    hexValue: '#8E24AA'
  },
  {
    label: 'purple-8',
    value: 'purple-8',
    size: '25px',
    name: 'circle',
    color: 'purple-8',
    hexValue: '#7B1FA2'
  },
  {
    label: 'purple-9',
    value: 'purple-9',
    size: '25px',
    name: 'circle',
    color: 'purple-9',
    hexValue: '#6A1B9A'
  },
  {
    label: 'purple-10',
    value: 'purple-10',
    size: '25px',
    name: 'circle',
    color: 'purple-10',
    hexValue: '#4A148C'
  },
  {
    label: 'purple-11',
    value: 'purple-11',
    size: '25px',
    name: 'circle',
    color: 'purple-11',
    hexValue: '#EA80FC'
  },
  {
    label: 'purple-12',
    value: 'purple-12',
    size: '25px',
    name: 'circle',
    color: 'purple-12',
    hexValue: '#E040FB'
  },
  {
    label: 'purple-13',
    value: 'purple-13',
    size: '25px',
    name: 'circle',
    color: 'purple-13',
    hexValue: '#D500F9'
  },
  {
    label: 'purple-14',
    value: 'purple-14',
    size: '25px',
    name: 'circle',
    color: 'purple-14',
    hexValue: '#AA00FF'
  },
//   {
//     label: 'deep-purple',
//     value: 'deep-purple',
//     size: '25px',
//     name: 'circle',
//     color: 'deep-purple',
//     hexValue: '#'
//   },
  {
    label: 'deep-purple-1',
    value: 'deep-purple-1',
    size: '25px',
    name: 'circle',
    color: 'deep-purple-1',
    hexValue: '#EDE7F6'
  },
  {
    label: 'deep-purple-2',
    value: 'deep-purple-2',
    size: '25px',
    name: 'circle',
    color: 'deep-purple-2',
    hexValue: '#D1C4E9'
  },
  {
    label: 'deep-purple-3',
    value: 'deep-purple-3',
    size: '25px',
    name: 'circle',
    color: 'deep-purple-3',
    hexValue: '#B39DDB'
  },
  {
    label: 'deep-purple-4',
    value: 'deep-purple-4',
    size: '25px',
    name: 'circle',
    color: 'deep-purple-4',
    hexValue: '#9575CD'
  },
  {
    label: 'deep-purple-5',
    value: 'deep-purple-5',
    size: '25px',
    name: 'circle',
    color: 'deep-purple-5',
    hexValue: '#7E57C2'
  },
  {
    label: 'deep-purple-6',
    value: 'deep-purple-6',
    size: '25px',
    name: 'circle',
    color: 'deep-purple-6',
    hexValue: '#673AB7'
  },
  {
    label: 'deep-purple-7',
    value: 'deep-purple-7',
    size: '25px',
    name: 'circle',
    color: 'deep-purple-7',
    hexValue: '#5E35B1'
  },
  {
    label: 'deep-purple-8',
    value: 'deep-purple-8',
    size: '25px',
    name: 'circle',
    color: 'deep-purple-8',
    hexValue: '#512DA8'
  },
  {
    label: 'deep-purple-9',
    value: 'deep-purple-9',
    size: '25px',
    name: 'circle',
    color: 'deep-purple-9',
    hexValue: '#4527A0'
  },
  {
    label: 'deep-purple-10',
    value: 'deep-purple-10',
    size: '25px',
    name: 'circle',
    color: 'deep-purple-10',
    hexValue: '#311B92'
  },
  {
    label: 'deep-purple-11',
    value: 'deep-purple-11',
    size: '25px',
    name: 'circle',
    color: 'deep-purple-11',
    hexValue: '#B388FF'
  },
  {
    label: 'deep-purple-12',
    value: 'deep-purple-12',
    size: '25px',
    name: 'circle',
    color: 'deep-purple-12',
    hexValue: '#7C4DFF'
  },
  {
    label: 'deep-purple-13',
    value: 'deep-purple-13',
    size: '25px',
    name: 'circle',
    color: 'deep-purple-13',
    hexValue: '#651FFF'
  },
  {
    label: 'deep-purple-14',
    value: 'deep-purple-14',
    size: '25px',
    name: 'circle',
    color: 'deep-purple-14',
    hexValue: '#6200EA'
  },
//   {
//     label: 'indigo',
//     value: 'indigo',
//     size: '25px',
//     name: 'circle',
//     color: 'indigo',
//     hexValue: '#'
//   },
  {
    label: 'indigo-1',
    value: 'indigo-1',
    size: '25px',
    name: 'circle',
    color: 'indigo-1',
    hexValue: '#E8EAF6'
  },
  {
    label: 'indigo-2',
    value: 'indigo-2',
    size: '25px',
    name: 'circle',
    color: 'indigo-2',
    hexValue: '#C5CAE9'
  },
  {
    label: 'indigo-3',
    value: 'indigo-3',
    size: '25px',
    name: 'circle',
    color: 'indigo-3',
    hexValue: '#9FA8DA'
  },
  {
    label: 'indigo-4',
    value: 'indigo-4',
    size: '25px',
    name: 'circle',
    color: 'indigo-4',
    hexValue: '#7986CB'
  },
  {
    label: 'indigo-5',
    value: 'indigo-5',
    size: '25px',
    name: 'circle',
    color: 'indigo-5',
    hexValue: '#5C6BC0'
  },
  {
    label: 'indigo-6',
    value: 'indigo-6',
    size: '25px',
    name: 'circle',
    color: 'indigo-6',
    hexValue: '#3F51B5'
  },
  {
    label: 'indigo-7',
    value: 'indigo-7',
    size: '25px',
    name: 'circle',
    color: 'indigo-7',
    hexValue: '#3949AB'
  },
  {
    label: 'indigo-8',
    value: 'indigo-8',
    size: '25px',
    name: 'circle',
    color: 'indigo-8',
    hexValue: '#303F9F'
  },
  {
    label: 'indigo-9',
    value: 'indigo-9',
    size: '25px',
    name: 'circle',
    color: 'indigo-9',
    hexValue: '#283593'
  },
  {
    label: 'indigo-10',
    value: 'indigo-10',
    size: '25px',
    name: 'circle',
    color: 'indigo-10',
    hexValue: '#1A237E'
  },
  {
    label: 'indigo-11',
    value: 'indigo-11',
    size: '25px',
    name: 'circle',
    color: 'indigo-11',
    hexValue: '#8C9EFF'
  },
  {
    label: 'indigo-12',
    value: 'indigo-12',
    size: '25px',
    name: 'circle',
    color: 'indigo-12',
    hexValue: '#536DFE'
  },
  {
    label: 'indigo-13',
    value: 'indigo-13',
    size: '25px',
    name: 'circle',
    color: 'indigo-13',
    hexValue: '#3D5AFE'
  },
  {
    label: 'indigo-14',
    value: 'indigo-14',
    size: '25px',
    name: 'circle',
    color: 'indigo-14',
    hexValue: '#304FFE'
  },
  {
    label: 'blue',
    value: 'blue',
    size: '25px',
    name: 'circle',
    color: 'blue',
    hexValue: '#2196f3'
  },
  {
    label: 'blue-1',
    value: 'blue-1',
    size: '25px',
    name: 'circle',
    color: 'blue-1',
    hexValue: '#E3F2FD'
  },
  {
    label: 'blue-2',
    value: 'blue-2',
    size: '25px',
    name: 'circle',
    color: 'blue-2',
    hexValue: '#BBDEFB'
  },
  {
    label: 'blue-3',
    value: 'blue-3',
    size: '25px',
    name: 'circle',
    color: 'blue-3',
    hexValue: '#90CAF9'
  },
  {
    label: 'blue-4',
    value: 'blue-4',
    size: '25px',
    name: 'circle',
    color: 'blue-4',
    hexValue: '#64B5F6'
  },
  {
    label: 'blue-5',
    value: 'blue-5',
    size: '25px',
    name: 'circle',
    color: 'blue-5',
    hexValue: '#42A5F5'
  },
  {
    label: 'blue-6',
    value: 'blue-6',
    size: '25px',
    name: 'circle',
    color: 'blue-6',
    hexValue: '#2196F3'
  },
  {
    label: 'blue-7',
    value: 'blue-7',
    size: '25px',
    name: 'circle',
    color: 'blue-7',
    hexValue: '#1E88E5'
  },
  {
    label: 'blue-8',
    value: 'blue-8',
    size: '25px',
    name: 'circle',
    color: 'blue-8',
    hexValue: '#1976D2'
  },
  {
    label: 'blue-9',
    value: 'blue-9',
    size: '25px',
    name: 'circle',
    color: 'blue-9',
    hexValue: '#1565C0'
  },
  {
    label: 'blue-10',
    value: 'blue-10',
    size: '25px',
    name: 'circle',
    color: 'blue-10',
    hexValue: '#0D47A1'
  },
  {
    label: 'blue-11',
    value: 'blue-11',
    size: '25px',
    name: 'circle',
    color: 'blue-11',
    hexValue: '#82B1FF'
  },
  {
    label: 'blue-12',
    value: 'blue-12',
    size: '25px',
    name: 'circle',
    color: 'blue-12',
    hexValue: '#448AFF'
  },
  {
    label: 'blue-13',
    value: 'blue-13',
    size: '25px',
    name: 'circle',
    color: 'blue-13',
    hexValue: '#2979FF'
  },
  {
    label: 'blue-14',
    value: 'blue-14',
    size: '25px',
    name: 'circle',
    color: 'blue-14',
    hexValue: '#2962FF'
  },
//   {
//     label: 'light-blue',
//     value: 'light-blue',
//     size: '25px',
//     name: 'circle',
//     color: 'light-blue',
//     hexValue: '#'
//   },
  {
    label: 'light-blue-1',
    value: 'light-blue-1',
    size: '25px',
    name: 'circle',
    color: 'light-blue-1',
    hexValue: '#E1F5FE'
  },
  {
    label: 'light-blue-2',
    value: 'light-blue-2',
    size: '25px',
    name: 'circle',
    color: 'light-blue-2',
    hexValue: '#B3E5FC'
  },
  {
    label: 'light-blue-3',
    value: 'light-blue-3',
    size: '25px',
    name: 'circle',
    color: 'light-blue-3',
    hexValue: '#81D4FA'
  },
  {
    label: 'light-blue-4',
    value: 'light-blue-4',
    size: '25px',
    name: 'circle',
    color: 'light-blue-4',
    hexValue: '#4FC3F7'
  },
  {
    label: 'light-blue-5',
    value: 'light-blue-5',
    size: '25px',
    name: 'circle',
    color: 'light-blue-5',
    hexValue: '#29B6F6'
  },
  {
    label: 'light-blue-6',
    value: 'light-blue-6',
    size: '25px',
    name: 'circle',
    color: 'light-blue-6',
    hexValue: '#03A9F4'
  },
  {
    label: 'light-blue-7',
    value: 'light-blue-7',
    size: '25px',
    name: 'circle',
    color: 'light-blue-7',
    hexValue: '#039BE5'
  },
  {
    label: 'light-blue-8',
    value: 'light-blue-8',
    size: '25px',
    name: 'circle',
    color: 'light-blue-8',
    hexValue: '#0288D1'
  },
  {
    label: 'light-blue-9',
    value: 'light-blue-9',
    size: '25px',
    name: 'circle',
    color: 'light-blue-9',
    hexValue: '#0277BD'
  },
  {
    label: 'light-blue-10',
    value: 'light-blue-10',
    size: '25px',
    name: 'circle',
    color: 'light-blue-10',
    hexValue: '#01579B'
  },
  {
    label: 'light-blue-11',
    value: 'light-blue-11',
    size: '25px',
    name: 'circle',
    color: 'light-blue-11',
    hexValue: '#80D8FF'
  },
  {
    label: 'light-blue-12',
    value: 'light-blue-12',
    size: '25px',
    name: 'circle',
    color: 'light-blue-12',
    hexValue: '#40C4FF'
  },
  {
    label: 'light-blue-13',
    value: 'light-blue-13',
    size: '25px',
    name: 'circle',
    color: 'light-blue-13',
    hexValue: '#00B0FF'
  },
  {
    label: 'light-blue-14',
    value: 'light-blue-14',
    size: '25px',
    name: 'circle',
    color: 'light-blue-14',
    hexValue: '#0091EA'
  },
//   {
//     label: 'cyan',
//     value: 'cyan',
//     size: '25px',
//     name: 'circle',
//     color: 'cyan',
//     hexValue: '#'
//   },
  {
    label: 'cyan-1',
    value: 'cyan-1',
    size: '25px',
    name: 'circle',
    color: 'cyan-1',
    hexValue: '#E0F7FA'
  },
  {
    label: 'cyan-2',
    value: 'cyan-2',
    size: '25px',
    name: 'circle',
    color: 'cyan-2',
    hexValue: '#B2EBF2'
  },
  {
    label: 'cyan-3',
    value: 'cyan-3',
    size: '25px',
    name: 'circle',
    color: 'cyan-3',
    hexValue: '#80DEEA'
  },
  {
    label: 'cyan-4',
    value: 'cyan-4',
    size: '25px',
    name: 'circle',
    color: 'cyan-4',
    hexValue: '#4DD0E1'
  },
  {
    label: 'cyan-5',
    value: 'cyan-5',
    size: '25px',
    name: 'circle',
    color: 'cyan-5',
    hexValue: '#26C6DA'
  },
  {
    label: 'cyan-6',
    value: 'cyan-6',
    size: '25px',
    name: 'circle',
    color: 'cyan-6',
    hexValue: '#00BCD4'
  },
  {
    label: 'cyan-7',
    value: 'cyan-7',
    size: '25px',
    name: 'circle',
    color: 'cyan-7',
    hexValue: '#00ACC1'
  },
  {
    label: 'cyan-8',
    value: 'cyan-8',
    size: '25px',
    name: 'circle',
    color: 'cyan-8',
    hexValue: '#0097A7'
  },
  {
    label: 'cyan-9',
    value: 'cyan-9',
    size: '25px',
    name: 'circle',
    color: 'cyan-9',
    hexValue: '#00838F'
  },
  {
    label: 'cyan-10',
    value: 'cyan-10',
    size: '25px',
    name: 'circle',
    color: 'cyan-10',
    hexValue: '#006064'
  },
  {
    label: 'cyan-11',
    value: 'cyan-11',
    size: '25px',
    name: 'circle',
    color: 'cyan-11',
    hexValue: '#84FFFF'
  },
  {
    label: 'cyan-12',
    value: 'cyan-12',
    size: '25px',
    name: 'circle',
    color: 'cyan-12',
    hexValue: '#18FFFF'
  },
  {
    label: 'cyan-13',
    value: 'cyan-13',
    size: '25px',
    name: 'circle',
    color: 'cyan-13',
    hexValue: '#00E5FF'
  },
  {
    label: 'cyan-14',
    value: 'cyan-14',
    size: '25px',
    name: 'circle',
    color: 'cyan-14',
    hexValue: '#00B8D4'
  },
//   {
//     label: 'teal',
//     value: 'teal',
//     size: '25px',
//     name: 'circle',
//     color: 'teal',
//     hexValue: '#'
//   },
  {
    label: 'teal-1',
    value: 'teal-1',
    size: '25px',
    name: 'circle',
    color: 'teal-1',
    hexValue: '#E0F2F1'
  },
  {
    label: 'teal-2',
    value: 'teal-2',
    size: '25px',
    name: 'circle',
    color: 'teal-2',
    hexValue: '#B2DFDB'
  },
  {
    label: 'teal-3',
    value: 'teal-3',
    size: '25px',
    name: 'circle',
    color: 'teal-3',
    hexValue: '#80CBC4'
  },
  {
    label: 'teal-4',
    value: 'teal-4',
    size: '25px',
    name: 'circle',
    color: 'teal-4',
    hexValue: '#4DB6AC'
  },
  {
    label: 'teal-5',
    value: 'teal-5',
    size: '25px',
    name: 'circle',
    color: 'teal-5',
    hexValue: '#26A69A'
  },
  {
    label: 'teal-6',
    value: 'teal-6',
    size: '25px',
    name: 'circle',
    color: 'teal-6',
    hexValue: '#009688'
  },
  {
    label: 'teal-7',
    value: 'teal-7',
    size: '25px',
    name: 'circle',
    color: 'teal-7',
    hexValue: '#00897B'
  },
  {
    label: 'teal-8',
    value: 'teal-8',
    size: '25px',
    name: 'circle',
    color: 'teal-8',
    hexValue: '#00796B'
  },
  {
    label: 'teal-9',
    value: 'teal-9',
    size: '25px',
    name: 'circle',
    color: 'teal-9',
    hexValue: '#00695C'
  },
  {
    label: 'teal-10',
    value: 'teal-10',
    size: '25px',
    name: 'circle',
    color: 'teal-10',
    hexValue: '#004D40'
  },
  {
    label: 'teal-11',
    value: 'teal-11',
    size: '25px',
    name: 'circle',
    color: 'teal-11',
    hexValue: '#A7FFEB'
  },
  {
    label: 'teal-12',
    value: 'teal-12',
    size: '25px',
    name: 'circle',
    color: 'teal-12',
    hexValue: '#64FFDA'
  },
  {
    label: 'teal-13',
    value: 'teal-13',
    size: '25px',
    name: 'circle',
    color: 'teal-13',
    hexValue: '#1DE9B6'
  },
  {
    label: 'teal-14',
    value: 'teal-14',
    size: '25px',
    name: 'circle',
    color: 'teal-14',
    hexValue: '#00BFA5'
  },
//   {
//     label: 'green',
//     value: 'green',
//     size: '25px',
//     name: 'circle',
//     color: 'green',
//     hexValue: '#'
//   },
  {
    label: 'green-1',
    value: 'green-1',
    size: '25px',
    name: 'circle',
    color: 'green-1',
    hexValue: '#E8F5E9'
  },
  {
    label: 'green-2',
    value: 'green-2',
    size: '25px',
    name: 'circle',
    color: 'green-2',
    hexValue: '#C8E6C9'
  },
  {
    label: 'green-3',
    value: 'green-3',
    size: '25px',
    name: 'circle',
    color: 'green-3',
    hexValue: '#A5D6A7'
  },
  {
    label: 'green-4',
    value: 'green-4',
    size: '25px',
    name: 'circle',
    color: 'green-4',
    hexValue: '#81C784'
  },
  {
    label: 'green-5',
    value: 'green-5',
    size: '25px',
    name: 'circle',
    color: 'green-5',
    hexValue: '#66BB6A'
  },
  {
    label: 'green-6',
    value: 'green-6',
    size: '25px',
    name: 'circle',
    color: 'green-6',
    hexValue: '#4CAF50'
  },
  {
    label: 'green-7',
    value: 'green-7',
    size: '25px',
    name: 'circle',
    color: 'green-7',
    hexValue: '#43A047'
  },
  {
    label: 'green-8',
    value: 'green-8',
    size: '25px',
    name: 'circle',
    color: 'green-8',
    hexValue: '#388E3C'
  },
  {
    label: 'green-9',
    value: 'green-9',
    size: '25px',
    name: 'circle',
    color: 'green-9',
    hexValue: '#2E7D32'
  },
  {
    label: 'green-10',
    value: 'green-10',
    size: '25px',
    name: 'circle',
    color: 'green-10',
    hexValue: '#1B5E20'
  },
  {
    label: 'green-11',
    value: 'green-11',
    size: '25px',
    name: 'circle',
    color: 'green-11',
    hexValue: '#B9F6CA'
  },
  {
    label: 'green-12',
    value: 'green-12',
    size: '25px',
    name: 'circle',
    color: 'green-12',
    hexValue: '#69F0AE'
  },
  {
    label: 'green-13',
    value: 'green-13',
    size: '25px',
    name: 'circle',
    color: 'green-13',
    hexValue: '#00E676'
  },
  {
    label: 'green-14',
    value: 'green-14',
    size: '25px',
    name: 'circle',
    color: 'green-14',
    hexValue: '#00C853'
  },
//   {
//     label: 'light-green',
//     value: 'light-green',
//     size: '25px',
//     name: 'circle',
//     color: 'light-green',
//     hexValue: '#'
//   },
  {
    label: 'light-green-1',
    value: 'light-green-1',
    size: '25px',
    name: 'circle',
    color: 'light-green-1',
    hexValue: '#F1F8E9'
  },
  {
    label: 'light-green-2',
    value: 'light-green-2',
    size: '25px',
    name: 'circle',
    color: 'light-green-2',
    hexValue: '#DCEDC8'
  },
  {
    label: 'light-green-3',
    value: 'light-green-3',
    size: '25px',
    name: 'circle',
    color: 'light-green-3',
    hexValue: '#C5E1A5'
  },
  {
    label: 'light-green-4',
    value: 'light-green-4',
    size: '25px',
    name: 'circle',
    color: 'light-green-4',
    hexValue: '#AED581'
  },
  {
    label: 'light-green-5',
    value: 'light-green-5',
    size: '25px',
    name: 'circle',
    color: 'light-green-5',
    hexValue: '#9CCC65'
  },
  {
    label: 'light-green-6',
    value: 'light-green-6',
    size: '25px',
    name: 'circle',
    color: 'light-green-6',
    hexValue: '#8BC34A'
  },
  {
    label: 'light-green-7',
    value: 'light-green-7',
    size: '25px',
    name: 'circle',
    color: 'light-green-7',
    hexValue: '#7CB342'
  },
  {
    label: 'light-green-8',
    value: 'light-green-8',
    size: '25px',
    name: 'circle',
    color: 'light-green-8',
    hexValue: '#689F38'
  },
  {
    label: 'light-green-9',
    value: 'light-green-9',
    size: '25px',
    name: 'circle',
    color: 'light-green-9',
    hexValue: '#558B2F'
  },
  {
    label: 'light-green-10',
    value: 'light-green-10',
    size: '25px',
    name: 'circle',
    color: 'light-green-10',
    hexValue: '#33691E'
  },
  {
    label: 'light-green-11',
    value: 'light-green-11',
    size: '25px',
    name: 'circle',
    color: 'light-green-11',
    hexValue: '#CCFF90'
  },
  {
    label: 'light-green-12',
    value: 'light-green-12',
    size: '25px',
    name: 'circle',
    color: 'light-green-12',
    hexValue: '#B2FF59'
  },
  {
    label: 'light-green-13',
    value: 'light-green-13',
    size: '25px',
    name: 'circle',
    color: 'light-green-13',
    hexValue: '#76FF03'
  },
  {
    label: 'light-green-14',
    value: 'light-green-14',
    size: '25px',
    name: 'circle',
    color: 'light-green-14',
    hexValue: '#64DD17'
  },
//   {
//     label: 'lime',
//     value: 'lime',
//     size: '25px',
//     name: 'circle',
//     color: 'lime',
//     hexValue: '#'
//   },
  {
    label: 'lime-1',
    value: 'lime-1',
    size: '25px',
    name: 'circle',
    color: 'lime-1',
    hexValue: '#F9FBE7'
  },
  {
    label: 'lime-2',
    value: 'lime-2',
    size: '25px',
    name: 'circle',
    color: 'lime-2',
    hexValue: '#F0F4C3'
  },
  {
    label: 'lime-3',
    value: 'lime-3',
    size: '25px',
    name: 'circle',
    color: 'lime-3',
    hexValue: '#E6EE9C'
  },
  {
    label: 'lime-4',
    value: 'lime-4',
    size: '25px',
    name: 'circle',
    color: 'lime-4',
    hexValue: '#DCE775'
  },
  {
    label: 'lime-5',
    value: 'lime-5',
    size: '25px',
    name: 'circle',
    color: 'lime-5',
    hexValue: '#D4E157'
  },
  {
    label: 'lime-6',
    value: 'lime-6',
    size: '25px',
    name: 'circle',
    color: 'lime-6',
    hexValue: '#CDDC39'
  },
  {
    label: 'lime-7',
    value: 'lime-7',
    size: '25px',
    name: 'circle',
    color: 'lime-7',
    hexValue: '#C0CA33'
  },
  {
    label: 'lime-8',
    value: 'lime-8',
    size: '25px',
    name: 'circle',
    color: 'lime-8',
    hexValue: '#AFB42B'
  },
  {
    label: 'lime-9',
    value: 'lime-9',
    size: '25px',
    name: 'circle',
    color: 'lime-9',
    hexValue: '#9E9D24'
  },
  {
    label: 'lime-10',
    value: 'lime-10',
    size: '25px',
    name: 'circle',
    color: 'lime-10',
    hexValue: '#827717'
  },
  {
    label: 'lime-11',
    value: 'lime-11',
    size: '25px',
    name: 'circle',
    color: 'lime-11',
    hexValue: '#F4FF81'
  },
  {
    label: 'lime-12',
    value: 'lime-12',
    size: '25px',
    name: 'circle',
    color: 'lime-12',
    hexValue: '#EEFF41'
  },
  {
    label: 'lime-13',
    value: 'lime-13',
    size: '25px',
    name: 'circle',
    color: 'lime-13',
    hexValue: '#C6FF00'
  },
  {
    label: 'lime-14',
    value: 'lime-14',
    size: '25px',
    name: 'circle',
    color: 'lime-14',
    hexValue: '#AEEA00'
  },
//   {
//     label: 'yellow',
//     value: 'yellow',
//     size: '25px',
//     name: 'circle',
//     color: 'yellow',
//     hexValue: '#'
//   },
  {
    label: 'yellow-1',
    value: 'yellow-1',
    size: '25px',
    name: 'circle',
    color: 'yellow-1',
    hexValue: '#FFFDE7'
  },
  {
    label: 'yellow-2',
    value: 'yellow-2',
    size: '25px',
    name: 'circle',
    color: 'yellow-2',
    hexValue: '#FFF9C4'
  },
  {
    label: 'yellow-3',
    value: 'yellow-3',
    size: '25px',
    name: 'circle',
    color: 'yellow-3',
    hexValue: '#FFF59D'
  },
  {
    label: 'yellow-4',
    value: 'yellow-4',
    size: '25px',
    name: 'circle',
    color: 'yellow-4',
    hexValue: '#FFF176'
  },
  {
    label: 'yellow-5',
    value: 'yellow-5',
    size: '25px',
    name: 'circle',
    color: 'yellow-5',
    hexValue: '#FFEE58'
  },
  {
    label: 'yellow-6',
    value: 'yellow-6',
    size: '25px',
    name: 'circle',
    color: 'yellow-6',
    hexValue: '#FFEB3B'
  },
  {
    label: 'yellow-7',
    value: 'yellow-7',
    size: '25px',
    name: 'circle',
    color: 'yellow-7',
    hexValue: '#FDD835'
  },
  {
    label: 'yellow-8',
    value: 'yellow-8',
    size: '25px',
    name: 'circle',
    color: 'yellow-8',
    hexValue: '#FBC02D'
  },
  {
    label: 'yellow-9',
    value: 'yellow-9',
    size: '25px',
    name: 'circle',
    color: 'yellow-9',
    hexValue: '#F9A825'
  },
  {
    label: 'yellow-10',
    value: 'yellow-10',
    size: '25px',
    name: 'circle',
    color: 'yellow-10',
    hexValue: '#F57F17'
  },
  {
    label: 'yellow-11',
    value: 'yellow-11',
    size: '25px',
    name: 'circle',
    color: 'yellow-11',
    hexValue: '#FFFF8D'
  },
  {
    label: 'yellow-12',
    value: 'yellow-12',
    size: '25px',
    name: 'circle',
    color: 'yellow-12',
    hexValue: '#FFFF00'
  },
  {
    label: 'yellow-13',
    value: 'yellow-13',
    size: '25px',
    name: 'circle',
    color: 'yellow-13',
    hexValue: '#FFEA00'
  },
  {
    label: 'yellow-14',
    value: 'yellow-14',
    size: '25px',
    name: 'circle',
    color: 'yellow-14',
    hexValue: '#FFD600'
  },
//   {
//     label: 'amber',
//     value: 'amber',
//     size: '25px',
//     name: 'circle',
//     color: 'amber',
//     hexValue: '#'
//   },
  {
    label: 'amber-1',
    value: 'amber-1',
    size: '25px',
    name: 'circle',
    color: 'amber-1',
    hexValue: '#FFF8E1'
  },
  {
    label: 'amber-2',
    value: 'amber-2',
    size: '25px',
    name: 'circle',
    color: 'amber-2',
    hexValue: '#FFECB3'
  },
  {
    label: 'amber-3',
    value: 'amber-3',
    size: '25px',
    name: 'circle',
    color: 'amber-3',
    hexValue: '#FFE082'
  },
  {
    label: 'amber-4',
    value: 'amber-4',
    size: '25px',
    name: 'circle',
    color: 'amber-4',
    hexValue: '#FFD54F'
  },
  {
    label: 'amber-5',
    value: 'amber-5',
    size: '25px',
    name: 'circle',
    color: 'amber-5',
    hexValue: '#FFCA28'
  },
  {
    label: 'amber-6',
    value: 'amber-6',
    size: '25px',
    name: 'circle',
    color: 'amber-6',
    hexValue: '#FFC107'
  },
  {
    label: 'amber-7',
    value: 'amber-7',
    size: '25px',
    name: 'circle',
    color: 'amber-7',
    hexValue: '#FFB300'
  },
  {
    label: 'amber-8',
    value: 'amber-8',
    size: '25px',
    name: 'circle',
    color: 'amber-8',
    hexValue: '#FFA000'
  },
  {
    label: 'amber-9',
    value: 'amber-9',
    size: '25px',
    name: 'circle',
    color: 'amber-9',
    hexValue: '#FF8F00'
  },
  {
    label: 'amber-10',
    value: 'amber-10',
    size: '25px',
    name: 'circle',
    color: 'amber-10',
    hexValue: '#FF6F00'
  },
  {
    label: 'amber-11',
    value: 'amber-11',
    size: '25px',
    name: 'circle',
    color: 'amber-11',
    hexValue: '#FFE57F'
  },
  {
    label: 'amber-12',
    value: 'amber-12',
    size: '25px',
    name: 'circle',
    color: 'amber-12',
    hexValue: '#FFD740'
  },
  {
    label: 'amber-13',
    value: 'amber-13',
    size: '25px',
    name: 'circle',
    color: 'amber-13',
    hexValue: '#FFC400'
  },
  {
    label: 'amber-14',
    value: 'amber-14',
    size: '25px',
    name: 'circle',
    color: 'amber-14',
    hexValue: '#FFAB00'
  },
//   {
//     label: 'orange',
//     value: 'orange',
//     size: '25px',
//     name: 'circle',
//     color: 'orange',
//     hexValue: '#'
//   },
  {
    label: 'orange-1',
    value: 'orange-1',
    size: '25px',
    name: 'circle',
    color: 'orange-1',
    hexValue: '#FFF3E0'
  },
  {
    label: 'orange-2',
    value: 'orange-2',
    size: '25px',
    name: 'circle',
    color: 'orange-2',
    hexValue: '#FFE0B2'
  },
  {
    label: 'orange-3',
    value: 'orange-3',
    size: '25px',
    name: 'circle',
    color: 'orange-3',
    hexValue: '#FFCC80'
  },
  {
    label: 'orange-4',
    value: 'orange-4',
    size: '25px',
    name: 'circle',
    color: 'orange-4',
    hexValue: '#FFB74D'
  },
  {
    label: 'orange-5',
    value: 'orange-5',
    size: '25px',
    name: 'circle',
    color: 'orange-5',
    hexValue: '#FFA726'
  },
  {
    label: 'orange-6',
    value: 'orange-6',
    size: '25px',
    name: 'circle',
    color: 'orange-6',
    hexValue: '#FF9800'
  },
  {
    label: 'orange-7',
    value: 'orange-7',
    size: '25px',
    name: 'circle',
    color: 'orange-7',
    hexValue: '#FB8C00'
  },
  {
    label: 'orange-8',
    value: 'orange-8',
    size: '25px',
    name: 'circle',
    color: 'orange-8',
    hexValue: '#F57C00'
  },
  {
    label: 'orange-9',
    value: 'orange-9',
    size: '25px',
    name: 'circle',
    color: 'orange-9',
    hexValue: '#EF6C00'
  },
  {
    label: 'orange-10',
    value: 'orange-10',
    size: '25px',
    name: 'circle',
    color: 'orange-10',
    hexValue: '#E65100'
  },
  {
    label: 'orange-11',
    value: 'orange-11',
    size: '25px',
    name: 'circle',
    color: 'orange-11',
    hexValue: '#FFD180'
  },
  {
    label: 'orange-12',
    value: 'orange-12',
    size: '25px',
    name: 'circle',
    color: 'orange-12',
    hexValue: '#FFAB40'
  },
  {
    label: 'orange-13',
    value: 'orange-13',
    size: '25px',
    name: 'circle',
    color: 'orange-13',
    hexValue: '#FF9100'
  },
  {
    label: 'orange-14',
    value: 'orange-14',
    size: '25px',
    name: 'circle',
    color: 'orange-14',
    hexValue: '#FF6D00'
  },
//   {
//     label: 'deep-orange',
//     value: 'deep-orange',
//     size: '25px',
//     name: 'circle',
//     color: 'deep-orange',
//     hexValue: '#'
//   },
  {
    label: 'deep-orange-1',
    value: 'deep-orange-1',
    size: '25px',
    name: 'circle',
    color: 'deep-orange-1',
    hexValue: '#FBE9E7'
  },
  {
    label: 'deep-orange-2',
    value: 'deep-orange-2',
    size: '25px',
    name: 'circle',
    color: 'deep-orange-2',
    hexValue: '#FFCCBC'
  },
  {
    label: 'deep-orange-3',
    value: 'deep-orange-3',
    size: '25px',
    name: 'circle',
    color: 'deep-orange-3',
    hexValue: '#FFAB91'
  },
  {
    label: 'deep-orange-4',
    value: 'deep-orange-4',
    size: '25px',
    name: 'circle',
    color: 'deep-orange-4',
    hexValue: '#FF8A65'
  },
  {
    label: 'deep-orange-5',
    value: 'deep-orange-5',
    size: '25px',
    name: 'circle',
    color: 'deep-orange-5',
    hexValue: '#FF7043'
  },
  {
    label: 'deep-orange-6',
    value: 'deep-orange-6',
    size: '25px',
    name: 'circle',
    color: 'deep-orange-6',
    hexValue: '#FF5722'
  },
  {
    label: 'deep-orange-7',
    value: 'deep-orange-7',
    size: '25px',
    name: 'circle',
    color: 'deep-orange-7',
    hexValue: '#F4511E'
  },
  {
    label: 'deep-orange-8',
    value: 'deep-orange-8',
    size: '25px',
    name: 'circle',
    color: 'deep-orange-8',
    hexValue: '#E64A19'
  },
  {
    label: 'deep-orange-9',
    value: 'deep-orange-9',
    size: '25px',
    name: 'circle',
    color: 'deep-orange-9',
    hexValue: '#D84315'
  },
  {
    label: 'deep-orange-10',
    value: 'deep-orange-10',
    size: '25px',
    name: 'circle',
    color: 'deep-orange-10',
    hexValue: '#BF360C'
  },
  {
    label: 'deep-orange-11',
    value: 'deep-orange-11',
    size: '25px',
    name: 'circle',
    color: 'deep-orange-11',
    hexValue: '#FF9E80'
  },
  {
    label: 'deep-orange-12',
    value: 'deep-orange-12',
    size: '25px',
    name: 'circle',
    color: 'deep-orange-12',
    hexValue: '#FF6E40'
  },
  {
    label: 'deep-orange-13',
    value: 'deep-orange-13',
    size: '25px',
    name: 'circle',
    color: 'deep-orange-13',
    hexValue: '#FF3D00'
  },
  {
    label: 'deep-orange-14',
    value: 'deep-orange-14',
    size: '25px',
    name: 'circle',
    color: 'deep-orange-14',
    hexValue: '#DD2C00'
  },
//   {
//     label: 'brown',
//     value: 'brown',
//     size: '25px',
//     name: 'circle',
//     color: 'brown',
//     hexValue: '#'
//   },
  {
    label: 'brown-1',
    value: 'brown-1',
    size: '25px',
    name: 'circle',
    color: 'brown-1',
    hexValue: '#EFEBE9'
  },
  {
    label: 'brown-2',
    value: 'brown-2',
    size: '25px',
    name: 'circle',
    color: 'brown-2',
    hexValue: '#D7CCC8'
  },
  {
    label: 'brown-3',
    value: 'brown-3',
    size: '25px',
    name: 'circle',
    color: 'brown-3',
    hexValue: '#BCAAA4'
  },
  {
    label: 'brown-4',
    value: 'brown-4',
    size: '25px',
    name: 'circle',
    color: 'brown-4',
    hexValue: '#A1887F'
  },
  {
    label: 'brown-5',
    value: 'brown-5',
    size: '25px',
    name: 'circle',
    color: 'brown-5',
    hexValue: '#8D6E63'
  },
  {
    label: 'brown-6',
    value: 'brown-6',
    size: '25px',
    name: 'circle',
    color: 'brown-6',
    hexValue: '#795548'
  },
  {
    label: 'brown-7',
    value: 'brown-7',
    size: '25px',
    name: 'circle',
    color: 'brown-7',
    hexValue: '#6D4C41'
  },
  {
    label: 'brown-8',
    value: 'brown-8',
    size: '25px',
    name: 'circle',
    color: 'brown-8',
    hexValue: '#5D4037'
  },
  {
    label: 'brown-9',
    value: 'brown-9',
    size: '25px',
    name: 'circle',
    color: 'brown-9',
    hexValue: '#4E342E'
  },
  {
    label: 'brown-10',
    value: 'brown-10',
    size: '25px',
    name: 'circle',
    color: 'brown-10',
    hexValue: '#3E2723'
  },
//   {
//     label: 'brown-11',
//     value: 'brown-11',
//     size: '25px',
//     name: 'circle',
//     color: 'brown-11',
//     hexValue: '#'
//   },
//   {
//     label: 'brown-12',
//     value: 'brown-12',
//     size: '25px',
//     name: 'circle',
//     color: 'brown-12',
//     hexValue: '#'
//   },
//   {
//     label: 'brown-13',
//     value: 'brown-13',
//     size: '25px',
//     name: 'circle',
//     color: 'brown-13',
//     hexValue: '#'
//   },
//   {
//     label: 'brown-14',
//     value: 'brown-14',
//     size: '25px',
//     name: 'circle',
//     color: 'brown-14',
//     hexValue: '#'
//   },
//   {
//     label: 'grey',
//     value: 'grey',
//     size: '25px',
//     name: 'circle',
//     color: 'grey',
//     hexValue: '#'
//   },
  {
    label: 'grey-1',
    value: 'grey-1',
    size: '25px',
    name: 'circle',
    color: 'grey-1',
    hexValue: '#FAFAFA'
  },
  {
    label: 'grey-2',
    value: 'grey-2',
    size: '25px',
    name: 'circle',
    color: 'grey-2',
    hexValue: '#F5F5F5'
  },
  {
    label: 'grey-3',
    value: 'grey-3',
    size: '25px',
    name: 'circle',
    color: 'grey-3',
    hexValue: '#EEEEEE'
  },
  {
    label: 'grey-4',
    value: 'grey-4',
    size: '25px',
    name: 'circle',
    color: 'grey-4',
    hexValue: '#E0E0E0'
  },
  {
    label: 'grey-5',
    value: 'grey-5',
    size: '25px',
    name: 'circle',
    color: 'grey-5',
    hexValue: '#BDBDBD'
  },
  {
    label: 'grey-6',
    value: 'grey-6',
    size: '25px',
    name: 'circle',
    color: 'grey-6',
    hexValue: '#9E9E9E'
  },
  {
    label: 'grey-7',
    value: 'grey-7',
    size: '25px',
    name: 'circle',
    color: 'grey-7',
    hexValue: '#757575'
  },
  {
    label: 'grey-8',
    value: 'grey-8',
    size: '25px',
    name: 'circle',
    color: 'grey-8',
    hexValue: '#616161'
  },
  {
    label: 'grey-9',
    value: 'grey-9',
    size: '25px',
    name: 'circle',
    color: 'grey-9',
    hexValue: '#424242'
  },
  {
    label: 'grey-10',
    value: 'grey-10',
    size: '25px',
    name: 'circle',
    color: 'grey-10',
    hexValue: '#212121'
  },
//   {
//     label: 'grey-11',
//     value: 'grey-11',
//     size: '25px',
//     name: 'circle',
//     color: 'grey-11',
//     hexValue: '#'
//   },
//   {
//     label: 'grey-12',
//     value: 'grey-12',
//     size: '25px',
//     name: 'circle',
//     color: 'grey-12',
//     hexValue: '#'
//   },
//   {
//     label: 'grey-13',
//     value: 'grey-13',
//     size: '25px',
//     name: 'circle',
//     color: 'grey-13',
//     hexValue: '#'
//   },
//   {
//     label: 'grey-14',
//     value: 'grey-14',
//     size: '25px',
//     name: 'circle',
//     color: 'grey-14',
//     hexValue: '#'
//   },
//   {
//     label: 'blue-grey',
//     value: 'blue-grey',
//     size: '25px',
//     name: 'circle',
//     color: 'blue-grey',
//     hexValue: '#'
//   },
  {
    label: 'blue-grey-1',
    value: 'blue-grey-1',
    size: '25px',
    name: 'circle',
    color: 'blue-grey-1',
    hexValue: '#ECEFF1'
  },
  {
    label: 'blue-grey-2',
    value: 'blue-grey-2',
    size: '25px',
    name: 'circle',
    color: 'blue-grey-2',
    hexValue: '#CFD8DC'
  },
  {
    label: 'blue-grey-3',
    value: 'blue-grey-3',
    size: '25px',
    name: 'circle',
    color: 'blue-grey-3',
    hexValue: '#B0BEC5'
  },
  {
    label: 'blue-grey-4',
    value: 'blue-grey-4',
    size: '25px',
    name: 'circle',
    color: 'blue-grey-4',
    hexValue: '#90A4AE'
  },
  {
    label: 'blue-grey-5',
    value: 'blue-grey-5',
    size: '25px',
    name: 'circle',
    color: 'blue-grey-5',
    hexValue: '#78909C'
  },
  {
    label: 'blue-grey-6',
    value: 'blue-grey-6',
    size: '25px',
    name: 'circle',
    color: 'blue-grey-6',
    hexValue: '#607D8B'
  },
  {
    label: 'blue-grey-7',
    value: 'blue-grey-7',
    size: '25px',
    name: 'circle',
    color: 'blue-grey-7',
    hexValue: '#546E7A'
  },
  {
    label: 'blue-grey-8',
    value: 'blue-grey-8',
    size: '25px',
    name: 'circle',
    color: 'blue-grey-8',
    hexValue: '#455A64'
  },
  {
    label: 'blue-grey-9',
    value: 'blue-grey-9',
    size: '25px',
    name: 'circle',
    color: 'blue-grey-9',
    hexValue: '#37474F'
  },
  {
    label: 'blue-grey-10',
    value: 'blue-grey-10',
    size: '25px',
    name: 'circle',
    color: 'blue-grey-10',
    hexValue: '#263238'
  },
//   {
//     label: 'blue-grey-11',
//     value: 'blue-grey-11',
//     size: '25px',
//     name: 'circle',
//     color: 'blue-grey-11',
//     hexValue: '#'
//   },
//   {
//     label: 'blue-grey-12',
//     value: 'blue-grey-12',
//     size: '25px',
//     name: 'circle',
//     color: 'blue-grey-12',
//     hexValue: '#'
//   },
//   {
//     label: 'blue-grey-13',
//     value: 'blue-grey-13',
//     size: '25px',
//     name: 'circle',
//     color: 'blue-grey-13',
//     hexValue: '#'
//   },
//   {
//     label: 'blue-grey-14',
//     value: 'blue-grey-14',
//     size: '25px',
//     name: 'circle',
//     color: 'blue-grey-14',
//     hexValue: '#'
//   }
]

export const colorPaletteListForCalendar = [
//   {
//     label: 'red ',
//     value: 'red ',
//     size: '25px',
//     name: 'circle',
//     color: 'red ',
//     hexValue: '#F44336'
//   },
  {
    label: 'red-1',
    value: 'red-1',
    size: '25px',
    name: 'circle',
    color: 'red-1',
    hexValue: '#FFEBEE'
},
{
    label: 'red-2',
    value: 'red-2',
    size: '25px',
    name: 'circle',
    color: 'red-2',
    hexValue: '#FFCDD2'
},
{
    label: 'red-3',
    value: 'red-3',
    size: '25px',
    name: 'circle',
    color: 'red-3',
    hexValue: '#EF9A9A'
  },
  {
    label: 'red-4',
    value: 'red-4',
    size: '25px',
    name: 'circle',
    color: 'red-4',
    hexValue: '#E57373'
  },
  {
    label: 'red-5',
    value: 'red-5',
    size: '25px',
    name: 'circle',
    color: 'red-5',
    hexValue: '#EF5350'
  },
  {
    label: 'red-6',
    value: 'red-6',
    size: '25px',
    name: 'circle',
    color: 'red-6',
    hexValue: '#F44336'
  },
  {
    label: 'red-7',
    value: 'red-7',
    size: '25px',
    name: 'circle',
    color: 'red-7',
    hexValue: '#E53935'
  },
  {
    label: 'red-8',
    value: 'red-8',
    size: '25px',
    name: 'circle',
    color: 'red-8',
    hexValue: '#D32F2F'
  },
  {
    label: 'red-9',
    value: 'red-9',
    size: '25px',
    name: 'circle',
    color: 'red-9',
    hexValue: '#C62828'
  },
  {
    label: 'red-10',
    value: 'red-10',
    size: '25px',
    name: 'circle',
    color: 'red-10',
    hexValue: '#B71C1C'
  },
  {
    label: 'red-11',
    value: 'red-11',
    size: '25px',
    name: 'circle',
    color: 'red-11',
    hexValue: '#FF8A80'
  },
  {
    label: 'red-12',
    value: 'red-12',
    size: '25px',
    name: 'circle',
    color: 'red-12',
    hexValue: '#FF5252'
  },
  {
    label: 'red-13',
    value: 'red-13',
    size: '25px',
    name: 'circle',
    color: 'red-13',
    hexValue: '#FF1744'
  },
  {
    label: 'red-14',
    value: 'red-14',
    size: '25px',
    name: 'circle',
    color: 'red-14',
    hexValue: '#D50000'
  },
//   {
//     label: 'pink',
//     value: 'pink',
//     size: '25px',
//     name: 'circle',
//     color: 'pink',
//     hexValue: '#'
//   },
  {
    label: 'pink-1',
    value: 'pink-1',
    size: '25px',
    name: 'circle',
    color: 'pink-1',
    hexValue: '#FCE4EC'
  },
  {
    label: 'pink-2',
    value: 'pink-2',
    size: '25px',
    name: 'circle',
    color: 'pink-2',
    hexValue: '#F8BBD0'
  },
  {
    label: 'pink-3',
    value: 'pink-3',
    size: '25px',
    name: 'circle',
    color: 'pink-3',
    hexValue: '#F48FB1'
  },
  {
    label: 'pink-4',
    value: 'pink-4',
    size: '25px',
    name: 'circle',
    color: 'pink-4',
    hexValue: '#F06292'
  },
  {
    label: 'pink-5',
    value: 'pink-5',
    size: '25px',
    name: 'circle',
    color: 'pink-5',
    hexValue: '#EC407A'
  },
  {
    label: 'pink-6',
    value: 'pink-6',
    size: '25px',
    name: 'circle',
    color: 'pink-6',
    hexValue: '#E91E63'
  },
  {
    label: 'pink-7',
    value: 'pink-7',
    size: '25px',
    name: 'circle',
    color: 'pink-7',
    hexValue: '#D81B60'
  },
  {
    label: 'pink-8',
    value: 'pink-8',
    size: '25px',
    name: 'circle',
    color: 'pink-8',
    hexValue: '#C2185B'
  },
  {
    label: 'pink-9',
    value: 'pink-9',
    size: '25px',
    name: 'circle',
    color: 'pink-9',
    hexValue: '#AD1457'
  },
  {
    label: 'pink-10',
    value: 'pink-10',
    size: '25px',
    name: 'circle',
    color: 'pink-10',
    hexValue: '#880E4F'
  },
  {
    label: 'pink-11',
    value: 'pink-11',
    size: '25px',
    name: 'circle',
    color: 'pink-11',
    hexValue: '#FF80AB'
  },
  {
    label: 'pink-12',
    value: 'pink-12',
    size: '25px',
    name: 'circle',
    color: 'pink-12',
    hexValue: '#FF4081'
  },
  {
    label: 'pink-13',
    value: 'pink-13',
    size: '25px',
    name: 'circle',
    color: 'pink-13',
    hexValue: '#F50057'
  },
  {
    label: 'pink-14',
    value: 'pink-14',
    size: '25px',
    name: 'circle',
    color: 'pink-14',
    hexValue: '#C51162'
  },
//   {
//     label: 'purple',
//     value: 'purple',
//     size: '25px',
//     name: 'circle',
//     color: 'purple',
//     hexValue: '#'
//   },
  {
    label: 'purple-1',
    value: 'purple-1',
    size: '25px',
    name: 'circle',
    color: 'purple-1',
    hexValue: '#F3E5F5'
  },
  {
    label: 'purple-2',
    value: 'purple-2',
    size: '25px',
    name: 'circle',
    color: 'purple-2',
    hexValue: '#E1BEE7'
  },
  {
    label: 'purple-3',
    value: 'purple-3',
    size: '25px',
    name: 'circle',
    color: 'purple-3',
    hexValue: '#CE93D8'
  },
  {
    label: 'purple-4',
    value: 'purple-4',
    size: '25px',
    name: 'circle',
    color: 'purple-4',
    hexValue: '#BA68C8'
  },
  {
    label: 'purple-5',
    value: 'purple-5',
    size: '25px',
    name: 'circle',
    color: 'purple-5',
    hexValue: '#AB47BC'
  },
  {
    label: 'purple-6',
    value: 'purple-6',
    size: '25px',
    name: 'circle',
    color: 'purple-6',
    hexValue: '#9C27B0'
  },
  {
    label: 'purple-7',
    value: 'purple-7',
    size: '25px',
    name: 'circle',
    color: 'purple-7',
    hexValue: '#8E24AA'
  },
  {
    label: 'purple-8',
    value: 'purple-8',
    size: '25px',
    name: 'circle',
    color: 'purple-8',
    hexValue: '#7B1FA2'
  },
  {
    label: 'purple-9',
    value: 'purple-9',
    size: '25px',
    name: 'circle',
    color: 'purple-9',
    hexValue: '#6A1B9A'
  },
  {
    label: 'purple-10',
    value: 'purple-10',
    size: '25px',
    name: 'circle',
    color: 'purple-10',
    hexValue: '#4A148C'
  },
  {
    label: 'purple-11',
    value: 'purple-11',
    size: '25px',
    name: 'circle',
    color: 'purple-11',
    hexValue: '#EA80FC'
  },
  {
    label: 'purple-12',
    value: 'purple-12',
    size: '25px',
    name: 'circle',
    color: 'purple-12',
    hexValue: '#E040FB'
  },
  {
    label: 'purple-13',
    value: 'purple-13',
    size: '25px',
    name: 'circle',
    color: 'purple-13',
    hexValue: '#D500F9'
  },
  {
    label: 'purple-14',
    value: 'purple-14',
    size: '25px',
    name: 'circle',
    color: 'purple-14',
    hexValue: '#AA00FF'
  },
//   {
//     label: 'deep-purple',
//     value: 'deep-purple',
//     size: '25px',
//     name: 'circle',
//     color: 'deep-purple',
//     hexValue: '#'
//   },
  {
    label: 'deep-purple-1',
    value: 'deep-purple-1',
    size: '25px',
    name: 'circle',
    color: 'deep-purple-1',
    hexValue: '#EDE7F6'
  },
  {
    label: 'deep-purple-2',
    value: 'deep-purple-2',
    size: '25px',
    name: 'circle',
    color: 'deep-purple-2',
    hexValue: '#D1C4E9'
  },
  {
    label: 'deep-purple-3',
    value: 'deep-purple-3',
    size: '25px',
    name: 'circle',
    color: 'deep-purple-3',
    hexValue: '#B39DDB'
  },
  {
    label: 'deep-purple-4',
    value: 'deep-purple-4',
    size: '25px',
    name: 'circle',
    color: 'deep-purple-4',
    hexValue: '#9575CD'
  },
  {
    label: 'deep-purple-5',
    value: 'deep-purple-5',
    size: '25px',
    name: 'circle',
    color: 'deep-purple-5',
    hexValue: '#7E57C2'
  },
  {
    label: 'deep-purple-6',
    value: 'deep-purple-6',
    size: '25px',
    name: 'circle',
    color: 'deep-purple-6',
    hexValue: '#673AB7'
  },
  {
    label: 'deep-purple-7',
    value: 'deep-purple-7',
    size: '25px',
    name: 'circle',
    color: 'deep-purple-7',
    hexValue: '#5E35B1'
  },
  {
    label: 'deep-purple-8',
    value: 'deep-purple-8',
    size: '25px',
    name: 'circle',
    color: 'deep-purple-8',
    hexValue: '#512DA8'
  },
  {
    label: 'deep-purple-9',
    value: 'deep-purple-9',
    size: '25px',
    name: 'circle',
    color: 'deep-purple-9',
    hexValue: '#4527A0'
  },
  {
    label: 'deep-purple-10',
    value: 'deep-purple-10',
    size: '25px',
    name: 'circle',
    color: 'deep-purple-10',
    hexValue: '#311B92'
  },
  {
    label: 'deep-purple-11',
    value: 'deep-purple-11',
    size: '25px',
    name: 'circle',
    color: 'deep-purple-11',
    hexValue: '#B388FF'
  },
  {
    label: 'deep-purple-12',
    value: 'deep-purple-12',
    size: '25px',
    name: 'circle',
    color: 'deep-purple-12',
    hexValue: '#7C4DFF'
  },
  {
    label: 'deep-purple-13',
    value: 'deep-purple-13',
    size: '25px',
    name: 'circle',
    color: 'deep-purple-13',
    hexValue: '#651FFF'
  },
  {
    label: 'deep-purple-14',
    value: 'deep-purple-14',
    size: '25px',
    name: 'circle',
    color: 'deep-purple-14',
    hexValue: '#6200EA'
  },
//   {
//     label: 'indigo',
//     value: 'indigo',
//     size: '25px',
//     name: 'circle',
//     color: 'indigo',
//     hexValue: '#'
//   },
  {
    label: 'indigo-1',
    value: 'indigo-1',
    size: '25px',
    name: 'circle',
    color: 'indigo-1',
    hexValue: '#E8EAF6'
  },
  {
    label: 'indigo-2',
    value: 'indigo-2',
    size: '25px',
    name: 'circle',
    color: 'indigo-2',
    hexValue: '#C5CAE9'
  },
  {
    label: 'indigo-3',
    value: 'indigo-3',
    size: '25px',
    name: 'circle',
    color: 'indigo-3',
    hexValue: '#9FA8DA'
  },
  {
    label: 'indigo-4',
    value: 'indigo-4',
    size: '25px',
    name: 'circle',
    color: 'indigo-4',
    hexValue: '#7986CB'
  },
  {
    label: 'indigo-5',
    value: 'indigo-5',
    size: '25px',
    name: 'circle',
    color: 'indigo-5',
    hexValue: '#5C6BC0'
  },
  {
    label: 'indigo-6',
    value: 'indigo-6',
    size: '25px',
    name: 'circle',
    color: 'indigo-6',
    hexValue: '#3F51B5'
  },
  {
    label: 'indigo-7',
    value: 'indigo-7',
    size: '25px',
    name: 'circle',
    color: 'indigo-7',
    hexValue: '#3949AB'
  },
  {
    label: 'indigo-8',
    value: 'indigo-8',
    size: '25px',
    name: 'circle',
    color: 'indigo-8',
    hexValue: '#303F9F'
  },
  {
    label: 'indigo-9',
    value: 'indigo-9',
    size: '25px',
    name: 'circle',
    color: 'indigo-9',
    hexValue: '#283593'
  },
  {
    label: 'indigo-10',
    value: 'indigo-10',
    size: '25px',
    name: 'circle',
    color: 'indigo-10',
    hexValue: '#1A237E'
  },
  {
    label: 'indigo-11',
    value: 'indigo-11',
    size: '25px',
    name: 'circle',
    color: 'indigo-11',
    hexValue: '#8C9EFF'
  },
  {
    label: 'indigo-12',
    value: 'indigo-12',
    size: '25px',
    name: 'circle',
    color: 'indigo-12',
    hexValue: '#536DFE'
  },
  {
    label: 'indigo-13',
    value: 'indigo-13',
    size: '25px',
    name: 'circle',
    color: 'indigo-13',
    hexValue: '#3D5AFE'
  },
  {
    label: 'indigo-14',
    value: 'indigo-14',
    size: '25px',
    name: 'circle',
    color: 'indigo-14',
    hexValue: '#304FFE'
  },
  {
    label: 'blue',
    value: 'blue',
    size: '25px',
    name: 'circle',
    color: 'blue',
    hexValue: '#2196f3'
  },
  {
    label: 'blue-1',
    value: 'blue-1',
    size: '25px',
    name: 'circle',
    color: 'blue-1',
    hexValue: '#E3F2FD'
  },
  {
    label: 'blue-2',
    value: 'blue-2',
    size: '25px',
    name: 'circle',
    color: 'blue-2',
    hexValue: '#BBDEFB'
  },
  {
    label: 'blue-3',
    value: 'blue-3',
    size: '25px',
    name: 'circle',
    color: 'blue-3',
    hexValue: '#90CAF9'
  },
  {
    label: 'blue-4',
    value: 'blue-4',
    size: '25px',
    name: 'circle',
    color: 'blue-4',
    hexValue: '#64B5F6'
  },
  {
    label: 'blue-5',
    value: 'blue-5',
    size: '25px',
    name: 'circle',
    color: 'blue-5',
    hexValue: '#42A5F5'
  },
  {
    label: 'blue-6',
    value: 'blue-6',
    size: '25px',
    name: 'circle',
    color: 'blue-6',
    hexValue: '#2196F3'
  },
  {
    label: 'blue-7',
    value: 'blue-7',
    size: '25px',
    name: 'circle',
    color: 'blue-7',
    hexValue: '#1E88E5'
  },
  {
    label: 'blue-8',
    value: 'blue-8',
    size: '25px',
    name: 'circle',
    color: 'blue-8',
    hexValue: '#1976D2'
  },
  {
    label: 'blue-9',
    value: 'blue-9',
    size: '25px',
    name: 'circle',
    color: 'blue-9',
    hexValue: '#1565C0'
  },
  {
    label: 'blue-10',
    value: 'blue-10',
    size: '25px',
    name: 'circle',
    color: 'blue-10',
    hexValue: '#0D47A1'
  },
  {
    label: 'blue-11',
    value: 'blue-11',
    size: '25px',
    name: 'circle',
    color: 'blue-11',
    hexValue: '#82B1FF'
  },
  {
    label: 'blue-12',
    value: 'blue-12',
    size: '25px',
    name: 'circle',
    color: 'blue-12',
    hexValue: '#448AFF'
  },
  {
    label: 'blue-13',
    value: 'blue-13',
    size: '25px',
    name: 'circle',
    color: 'blue-13',
    hexValue: '#2979FF'
  },
  {
    label: 'blue-14',
    value: 'blue-14',
    size: '25px',
    name: 'circle',
    color: 'blue-14',
    hexValue: '#2962FF'
  },
//   {
//     label: 'light-blue',
//     value: 'light-blue',
//     size: '25px',
//     name: 'circle',
//     color: 'light-blue',
//     hexValue: '#'
//   },
  {
    label: 'light-blue-1',
    value: 'light-blue-1',
    size: '25px',
    name: 'circle',
    color: 'light-blue-1',
    hexValue: '#E1F5FE'
  },
  {
    label: 'light-blue-2',
    value: 'light-blue-2',
    size: '25px',
    name: 'circle',
    color: 'light-blue-2',
    hexValue: '#B3E5FC'
  },
  {
    label: 'light-blue-3',
    value: 'light-blue-3',
    size: '25px',
    name: 'circle',
    color: 'light-blue-3',
    hexValue: '#81D4FA'
  },
  {
    label: 'light-blue-4',
    value: 'light-blue-4',
    size: '25px',
    name: 'circle',
    color: 'light-blue-4',
    hexValue: '#4FC3F7'
  },
  {
    label: 'light-blue-5',
    value: 'light-blue-5',
    size: '25px',
    name: 'circle',
    color: 'light-blue-5',
    hexValue: '#29B6F6'
  },
  {
    label: 'light-blue-6',
    value: 'light-blue-6',
    size: '25px',
    name: 'circle',
    color: 'light-blue-6',
    hexValue: '#03A9F4'
  },
  {
    label: 'light-blue-7',
    value: 'light-blue-7',
    size: '25px',
    name: 'circle',
    color: 'light-blue-7',
    hexValue: '#039BE5'
  },
  {
    label: 'light-blue-8',
    value: 'light-blue-8',
    size: '25px',
    name: 'circle',
    color: 'light-blue-8',
    hexValue: '#0288D1'
  },
  {
    label: 'light-blue-9',
    value: 'light-blue-9',
    size: '25px',
    name: 'circle',
    color: 'light-blue-9',
    hexValue: '#0277BD'
  },
  {
    label: 'light-blue-10',
    value: 'light-blue-10',
    size: '25px',
    name: 'circle',
    color: 'light-blue-10',
    hexValue: '#01579B'
  },
  {
    label: 'light-blue-11',
    value: 'light-blue-11',
    size: '25px',
    name: 'circle',
    color: 'light-blue-11',
    hexValue: '#80D8FF'
  },
  {
    label: 'light-blue-12',
    value: 'light-blue-12',
    size: '25px',
    name: 'circle',
    color: 'light-blue-12',
    hexValue: '#40C4FF'
  },
  {
    label: 'light-blue-13',
    value: 'light-blue-13',
    size: '25px',
    name: 'circle',
    color: 'light-blue-13',
    hexValue: '#00B0FF'
  },
  {
    label: 'light-blue-14',
    value: 'light-blue-14',
    size: '25px',
    name: 'circle',
    color: 'light-blue-14',
    hexValue: '#0091EA'
  },
//   {
//     label: 'cyan',
//     value: 'cyan',
//     size: '25px',
//     name: 'circle',
//     color: 'cyan',
//     hexValue: '#'
//   },
  {
    label: 'cyan-1',
    value: 'cyan-1',
    size: '25px',
    name: 'circle',
    color: 'cyan-1',
    hexValue: '#E0F7FA'
  },
  {
    label: 'cyan-2',
    value: 'cyan-2',
    size: '25px',
    name: 'circle',
    color: 'cyan-2',
    hexValue: '#B2EBF2'
  },
  {
    label: 'cyan-3',
    value: 'cyan-3',
    size: '25px',
    name: 'circle',
    color: 'cyan-3',
    hexValue: '#80DEEA'
  },
  {
    label: 'cyan-4',
    value: 'cyan-4',
    size: '25px',
    name: 'circle',
    color: 'cyan-4',
    hexValue: '#4DD0E1'
  },
  {
    label: 'cyan-5',
    value: 'cyan-5',
    size: '25px',
    name: 'circle',
    color: 'cyan-5',
    hexValue: '#26C6DA'
  },
  {
    label: 'cyan-6',
    value: 'cyan-6',
    size: '25px',
    name: 'circle',
    color: 'cyan-6',
    hexValue: '#00BCD4'
  },
  {
    label: 'cyan-7',
    value: 'cyan-7',
    size: '25px',
    name: 'circle',
    color: 'cyan-7',
    hexValue: '#00ACC1'
  },
  {
    label: 'cyan-8',
    value: 'cyan-8',
    size: '25px',
    name: 'circle',
    color: 'cyan-8',
    hexValue: '#0097A7'
  },
  {
    label: 'cyan-9',
    value: 'cyan-9',
    size: '25px',
    name: 'circle',
    color: 'cyan-9',
    hexValue: '#00838F'
  },
  {
    label: 'cyan-10',
    value: 'cyan-10',
    size: '25px',
    name: 'circle',
    color: 'cyan-10',
    hexValue: '#006064'
  },
  {
    label: 'cyan-11',
    value: 'cyan-11',
    size: '25px',
    name: 'circle',
    color: 'cyan-11',
    hexValue: '#84FFFF'
  },
  {
    label: 'cyan-12',
    value: 'cyan-12',
    size: '25px',
    name: 'circle',
    color: 'cyan-12',
    hexValue: '#18FFFF'
  },
  {
    label: 'cyan-13',
    value: 'cyan-13',
    size: '25px',
    name: 'circle',
    color: 'cyan-13',
    hexValue: '#00E5FF'
  },
  {
    label: 'cyan-14',
    value: 'cyan-14',
    size: '25px',
    name: 'circle',
    color: 'cyan-14',
    hexValue: '#00B8D4'
  },
//   {
//     label: 'teal',
//     value: 'teal',
//     size: '25px',
//     name: 'circle',
//     color: 'teal',
//     hexValue: '#'
//   },
  {
    label: 'teal-1',
    value: 'teal-1',
    size: '25px',
    name: 'circle',
    color: 'teal-1',
    hexValue: '#E0F2F1'
  },
  {
    label: 'teal-2',
    value: 'teal-2',
    size: '25px',
    name: 'circle',
    color: 'teal-2',
    hexValue: '#B2DFDB'
  },
  {
    label: 'teal-3',
    value: 'teal-3',
    size: '25px',
    name: 'circle',
    color: 'teal-3',
    hexValue: '#80CBC4'
  },
  {
    label: 'teal-4',
    value: 'teal-4',
    size: '25px',
    name: 'circle',
    color: 'teal-4',
    hexValue: '#4DB6AC'
  },
  {
    label: 'teal-5',
    value: 'teal-5',
    size: '25px',
    name: 'circle',
    color: 'teal-5',
    hexValue: '#26A69A'
  },
  {
    label: 'teal-6',
    value: 'teal-6',
    size: '25px',
    name: 'circle',
    color: 'teal-6',
    hexValue: '#009688'
  },
  {
    label: 'teal-7',
    value: 'teal-7',
    size: '25px',
    name: 'circle',
    color: 'teal-7',
    hexValue: '#00897B'
  },
  {
    label: 'teal-8',
    value: 'teal-8',
    size: '25px',
    name: 'circle',
    color: 'teal-8',
    hexValue: '#00796B'
  },
  {
    label: 'teal-9',
    value: 'teal-9',
    size: '25px',
    name: 'circle',
    color: 'teal-9',
    hexValue: '#00695C'
  },
  {
    label: 'teal-10',
    value: 'teal-10',
    size: '25px',
    name: 'circle',
    color: 'teal-10',
    hexValue: '#004D40'
  },
  {
    label: 'teal-11',
    value: 'teal-11',
    size: '25px',
    name: 'circle',
    color: 'teal-11',
    hexValue: '#A7FFEB'
  },
  {
    label: 'teal-12',
    value: 'teal-12',
    size: '25px',
    name: 'circle',
    color: 'teal-12',
    hexValue: '#64FFDA'
  },
  {
    label: 'teal-13',
    value: 'teal-13',
    size: '25px',
    name: 'circle',
    color: 'teal-13',
    hexValue: '#1DE9B6'
  },
  {
    label: 'teal-14',
    value: 'teal-14',
    size: '25px',
    name: 'circle',
    color: 'teal-14',
    hexValue: '#00BFA5'
  },
//   {
//     label: 'green',
//     value: 'green',
//     size: '25px',
//     name: 'circle',
//     color: 'green',
//     hexValue: '#'
//   },
  {
    label: 'green-1',
    value: 'green-1',
    size: '25px',
    name: 'circle',
    color: 'green-1',
    hexValue: '#E8F5E9'
  },
  {
    label: 'green-2',
    value: 'green-2',
    size: '25px',
    name: 'circle',
    color: 'green-2',
    hexValue: '#C8E6C9'
  },
  {
    label: 'green-3',
    value: 'green-3',
    size: '25px',
    name: 'circle',
    color: 'green-3',
    hexValue: '#A5D6A7'
  },
  {
    label: 'green-4',
    value: 'green-4',
    size: '25px',
    name: 'circle',
    color: 'green-4',
    hexValue: '#81C784'
  },
  {
    label: 'green-5',
    value: 'green-5',
    size: '25px',
    name: 'circle',
    color: 'green-5',
    hexValue: '#66BB6A'
  },
  {
    label: 'green-6',
    value: 'green-6',
    size: '25px',
    name: 'circle',
    color: 'green-6',
    hexValue: '#4CAF50'
  },
  {
    label: 'green-7',
    value: 'green-7',
    size: '25px',
    name: 'circle',
    color: 'green-7',
    hexValue: '#43A047'
  },
  {
    label: 'green-8',
    value: 'green-8',
    size: '25px',
    name: 'circle',
    color: 'green-8',
    hexValue: '#388E3C'
  },
  {
    label: 'green-9',
    value: 'green-9',
    size: '25px',
    name: 'circle',
    color: 'green-9',
    hexValue: '#2E7D32'
  },
  {
    label: 'green-10',
    value: 'green-10',
    size: '25px',
    name: 'circle',
    color: 'green-10',
    hexValue: '#1B5E20'
  },
  {
    label: 'green-11',
    value: 'green-11',
    size: '25px',
    name: 'circle',
    color: 'green-11',
    hexValue: '#B9F6CA'
  },
  {
    label: 'green-12',
    value: 'green-12',
    size: '25px',
    name: 'circle',
    color: 'green-12',
    hexValue: '#69F0AE'
  },
  {
    label: 'green-13',
    value: 'green-13',
    size: '25px',
    name: 'circle',
    color: 'green-13',
    hexValue: '#00E676'
  },
  {
    label: 'green-14',
    value: 'green-14',
    size: '25px',
    name: 'circle',
    color: 'green-14',
    hexValue: '#00C853'
  },
//   {
//     label: 'light-green',
//     value: 'light-green',
//     size: '25px',
//     name: 'circle',
//     color: 'light-green',
//     hexValue: '#'
//   },
  {
    label: 'light-green-1',
    value: 'light-green-1',
    size: '25px',
    name: 'circle',
    color: 'light-green-1',
    hexValue: '#F1F8E9'
  },
  {
    label: 'light-green-2',
    value: 'light-green-2',
    size: '25px',
    name: 'circle',
    color: 'light-green-2',
    hexValue: '#DCEDC8'
  },
  {
    label: 'light-green-3',
    value: 'light-green-3',
    size: '25px',
    name: 'circle',
    color: 'light-green-3',
    hexValue: '#C5E1A5'
  },
  {
    label: 'light-green-4',
    value: 'light-green-4',
    size: '25px',
    name: 'circle',
    color: 'light-green-4',
    hexValue: '#AED581'
  },
  {
    label: 'light-green-5',
    value: 'light-green-5',
    size: '25px',
    name: 'circle',
    color: 'light-green-5',
    hexValue: '#9CCC65'
  },
  {
    label: 'light-green-6',
    value: 'light-green-6',
    size: '25px',
    name: 'circle',
    color: 'light-green-6',
    hexValue: '#8BC34A'
  },
  {
    label: 'light-green-7',
    value: 'light-green-7',
    size: '25px',
    name: 'circle',
    color: 'light-green-7',
    hexValue: '#7CB342'
  },
  {
    label: 'light-green-8',
    value: 'light-green-8',
    size: '25px',
    name: 'circle',
    color: 'light-green-8',
    hexValue: '#689F38'
  },
  {
    label: 'light-green-9',
    value: 'light-green-9',
    size: '25px',
    name: 'circle',
    color: 'light-green-9',
    hexValue: '#558B2F'
  },
  {
    label: 'light-green-10',
    value: 'light-green-10',
    size: '25px',
    name: 'circle',
    color: 'light-green-10',
    hexValue: '#33691E'
  },
  {
    label: 'light-green-11',
    value: 'light-green-11',
    size: '25px',
    name: 'circle',
    color: 'light-green-11',
    hexValue: '#CCFF90'
  },
  {
    label: 'light-green-12',
    value: 'light-green-12',
    size: '25px',
    name: 'circle',
    color: 'light-green-12',
    hexValue: '#B2FF59'
  },
  {
    label: 'light-green-13',
    value: 'light-green-13',
    size: '25px',
    name: 'circle',
    color: 'light-green-13',
    hexValue: '#76FF03'
  },
  {
    label: 'light-green-14',
    value: 'light-green-14',
    size: '25px',
    name: 'circle',
    color: 'light-green-14',
    hexValue: '#64DD17'
  },
//   {
//     label: 'lime',
//     value: 'lime',
//     size: '25px',
//     name: 'circle',
//     color: 'lime',
//     hexValue: '#'
//   },
  {
    label: 'lime-1',
    value: 'lime-1',
    size: '25px',
    name: 'circle',
    color: 'lime-1',
    hexValue: '#F9FBE7'
  },
  {
    label: 'lime-2',
    value: 'lime-2',
    size: '25px',
    name: 'circle',
    color: 'lime-2',
    hexValue: '#F0F4C3'
  },
  {
    label: 'lime-3',
    value: 'lime-3',
    size: '25px',
    name: 'circle',
    color: 'lime-3',
    hexValue: '#E6EE9C'
  },
  {
    label: 'lime-4',
    value: 'lime-4',
    size: '25px',
    name: 'circle',
    color: 'lime-4',
    hexValue: '#DCE775'
  },
  {
    label: 'lime-5',
    value: 'lime-5',
    size: '25px',
    name: 'circle',
    color: 'lime-5',
    hexValue: '#D4E157'
  },
  {
    label: 'lime-6',
    value: 'lime-6',
    size: '25px',
    name: 'circle',
    color: 'lime-6',
    hexValue: '#CDDC39'
  },
  {
    label: 'lime-7',
    value: 'lime-7',
    size: '25px',
    name: 'circle',
    color: 'lime-7',
    hexValue: '#C0CA33'
  },
  {
    label: 'lime-8',
    value: 'lime-8',
    size: '25px',
    name: 'circle',
    color: 'lime-8',
    hexValue: '#AFB42B'
  },
  {
    label: 'lime-9',
    value: 'lime-9',
    size: '25px',
    name: 'circle',
    color: 'lime-9',
    hexValue: '#9E9D24'
  },
  {
    label: 'lime-10',
    value: 'lime-10',
    size: '25px',
    name: 'circle',
    color: 'lime-10',
    hexValue: '#827717'
  },
  {
    label: 'lime-11',
    value: 'lime-11',
    size: '25px',
    name: 'circle',
    color: 'lime-11',
    hexValue: '#F4FF81'
  },
  {
    label: 'lime-12',
    value: 'lime-12',
    size: '25px',
    name: 'circle',
    color: 'lime-12',
    hexValue: '#EEFF41'
  },
  {
    label: 'lime-13',
    value: 'lime-13',
    size: '25px',
    name: 'circle',
    color: 'lime-13',
    hexValue: '#C6FF00'
  },
  {
    label: 'lime-14',
    value: 'lime-14',
    size: '25px',
    name: 'circle',
    color: 'lime-14',
    hexValue: '#AEEA00'
  },
//   {
//     label: 'yellow',
//     value: 'yellow',
//     size: '25px',
//     name: 'circle',
//     color: 'yellow',
//     hexValue: '#'
//   },
  {
    label: 'yellow-1',
    value: 'yellow-1',
    size: '25px',
    name: 'circle',
    color: 'yellow-1',
    hexValue: '#FFFDE7'
  },
  {
    label: 'yellow-2',
    value: 'yellow-2',
    size: '25px',
    name: 'circle',
    color: 'yellow-2',
    hexValue: '#FFF9C4'
  },
  {
    label: 'yellow-3',
    value: 'yellow-3',
    size: '25px',
    name: 'circle',
    color: 'yellow-3',
    hexValue: '#FFF59D'
  },
  {
    label: 'yellow-4',
    value: 'yellow-4',
    size: '25px',
    name: 'circle',
    color: 'yellow-4',
    hexValue: '#FFF176'
  },
  {
    label: 'yellow-5',
    value: 'yellow-5',
    size: '25px',
    name: 'circle',
    color: 'yellow-5',
    hexValue: '#FFEE58'
  },
  {
    label: 'yellow-6',
    value: 'yellow-6',
    size: '25px',
    name: 'circle',
    color: 'yellow-6',
    hexValue: '#FFEB3B'
  },
  {
    label: 'yellow-7',
    value: 'yellow-7',
    size: '25px',
    name: 'circle',
    color: 'yellow-7',
    hexValue: '#FDD835'
  },
  {
    label: 'yellow-8',
    value: 'yellow-8',
    size: '25px',
    name: 'circle',
    color: 'yellow-8',
    hexValue: '#FBC02D'
  },
  {
    label: 'yellow-9',
    value: 'yellow-9',
    size: '25px',
    name: 'circle',
    color: 'yellow-9',
    hexValue: '#F9A825'
  },
  {
    label: 'yellow-10',
    value: 'yellow-10',
    size: '25px',
    name: 'circle',
    color: 'yellow-10',
    hexValue: '#F57F17'
  },
  {
    label: 'yellow-11',
    value: 'yellow-11',
    size: '25px',
    name: 'circle',
    color: 'yellow-11',
    hexValue: '#FFFF8D'
  },
  {
    label: 'yellow-12',
    value: 'yellow-12',
    size: '25px',
    name: 'circle',
    color: 'yellow-12',
    hexValue: '#FFFF00'
  },
  {
    label: 'yellow-13',
    value: 'yellow-13',
    size: '25px',
    name: 'circle',
    color: 'yellow-13',
    hexValue: '#FFEA00'
  },
  {
    label: 'yellow-14',
    value: 'yellow-14',
    size: '25px',
    name: 'circle',
    color: 'yellow-14',
    hexValue: '#FFD600'
  },
//   {
//     label: 'amber',
//     value: 'amber',
//     size: '25px',
//     name: 'circle',
//     color: 'amber',
//     hexValue: '#'
//   },
  {
    label: 'amber-1',
    value: 'amber-1',
    size: '25px',
    name: 'circle',
    color: 'amber-1',
    hexValue: '#FFF8E1'
  },
  {
    label: 'amber-2',
    value: 'amber-2',
    size: '25px',
    name: 'circle',
    color: 'amber-2',
    hexValue: '#FFECB3'
  },
  {
    label: 'amber-3',
    value: 'amber-3',
    size: '25px',
    name: 'circle',
    color: 'amber-3',
    hexValue: '#FFE082'
  },
  {
    label: 'amber-4',
    value: 'amber-4',
    size: '25px',
    name: 'circle',
    color: 'amber-4',
    hexValue: '#FFD54F'
  },
  {
    label: 'amber-5',
    value: 'amber-5',
    size: '25px',
    name: 'circle',
    color: 'amber-5',
    hexValue: '#FFCA28'
  },
  {
    label: 'amber-6',
    value: 'amber-6',
    size: '25px',
    name: 'circle',
    color: 'amber-6',
    hexValue: '#FFC107'
  },
  {
    label: 'amber-7',
    value: 'amber-7',
    size: '25px',
    name: 'circle',
    color: 'amber-7',
    hexValue: '#FFB300'
  },
  {
    label: 'amber-8',
    value: 'amber-8',
    size: '25px',
    name: 'circle',
    color: 'amber-8',
    hexValue: '#FFA000'
  },
  {
    label: 'amber-9',
    value: 'amber-9',
    size: '25px',
    name: 'circle',
    color: 'amber-9',
    hexValue: '#FF8F00'
  },
  {
    label: 'amber-10',
    value: 'amber-10',
    size: '25px',
    name: 'circle',
    color: 'amber-10',
    hexValue: '#FF6F00'
  },
  {
    label: 'amber-11',
    value: 'amber-11',
    size: '25px',
    name: 'circle',
    color: 'amber-11',
    hexValue: '#FFE57F'
  },
  {
    label: 'amber-12',
    value: 'amber-12',
    size: '25px',
    name: 'circle',
    color: 'amber-12',
    hexValue: '#FFD740'
  },
  {
    label: 'amber-13',
    value: 'amber-13',
    size: '25px',
    name: 'circle',
    color: 'amber-13',
    hexValue: '#FFC400'
  },
  {
    label: 'amber-14',
    value: 'amber-14',
    size: '25px',
    name: 'circle',
    color: 'amber-14',
    hexValue: '#FFAB00'
  },
//   {
//     label: 'orange',
//     value: 'orange',
//     size: '25px',
//     name: 'circle',
//     color: 'orange',
//     hexValue: '#'
//   },
  {
    label: 'orange-1',
    value: 'orange-1',
    size: '25px',
    name: 'circle',
    color: 'orange-1',
    hexValue: '#FFF3E0'
  },
  {
    label: 'orange-2',
    value: 'orange-2',
    size: '25px',
    name: 'circle',
    color: 'orange-2',
    hexValue: '#FFE0B2'
  },
  {
    label: 'orange-3',
    value: 'orange-3',
    size: '25px',
    name: 'circle',
    color: 'orange-3',
    hexValue: '#FFCC80'
  },
  {
    label: 'orange-4',
    value: 'orange-4',
    size: '25px',
    name: 'circle',
    color: 'orange-4',
    hexValue: '#FFB74D'
  },
  {
    label: 'orange-5',
    value: 'orange-5',
    size: '25px',
    name: 'circle',
    color: 'orange-5',
    hexValue: '#FFA726'
  },
  {
    label: 'orange-6',
    value: 'orange-6',
    size: '25px',
    name: 'circle',
    color: 'orange-6',
    hexValue: '#FF9800'
  },
  {
    label: 'orange-7',
    value: 'orange-7',
    size: '25px',
    name: 'circle',
    color: 'orange-7',
    hexValue: '#FB8C00'
  },
  {
    label: 'orange-8',
    value: 'orange-8',
    size: '25px',
    name: 'circle',
    color: 'orange-8',
    hexValue: '#F57C00'
  },
  {
    label: 'orange-9',
    value: 'orange-9',
    size: '25px',
    name: 'circle',
    color: 'orange-9',
    hexValue: '#EF6C00'
  },
  {
    label: 'orange-10',
    value: 'orange-10',
    size: '25px',
    name: 'circle',
    color: 'orange-10',
    hexValue: '#E65100'
  },
  {
    label: 'orange-11',
    value: 'orange-11',
    size: '25px',
    name: 'circle',
    color: 'orange-11',
    hexValue: '#FFD180'
  },
  {
    label: 'orange-12',
    value: 'orange-12',
    size: '25px',
    name: 'circle',
    color: 'orange-12',
    hexValue: '#FFAB40'
  },
  {
    label: 'orange-13',
    value: 'orange-13',
    size: '25px',
    name: 'circle',
    color: 'orange-13',
    hexValue: '#FF9100'
  },
  {
    label: 'orange-14',
    value: 'orange-14',
    size: '25px',
    name: 'circle',
    color: 'orange-14',
    hexValue: '#FF6D00'
  },
//   {
//     label: 'deep-orange',
//     value: 'deep-orange',
//     size: '25px',
//     name: 'circle',
//     color: 'deep-orange',
//     hexValue: '#'
//   },
  {
    label: 'deep-orange-1',
    value: 'deep-orange-1',
    size: '25px',
    name: 'circle',
    color: 'deep-orange-1',
    hexValue: '#FBE9E7'
  },
  {
    label: 'deep-orange-2',
    value: 'deep-orange-2',
    size: '25px',
    name: 'circle',
    color: 'deep-orange-2',
    hexValue: '#FFCCBC'
  },
  {
    label: 'deep-orange-3',
    value: 'deep-orange-3',
    size: '25px',
    name: 'circle',
    color: 'deep-orange-3',
    hexValue: '#FFAB91'
  },
  {
    label: 'deep-orange-4',
    value: 'deep-orange-4',
    size: '25px',
    name: 'circle',
    color: 'deep-orange-4',
    hexValue: '#FF8A65'
  },
  {
    label: 'deep-orange-5',
    value: 'deep-orange-5',
    size: '25px',
    name: 'circle',
    color: 'deep-orange-5',
    hexValue: '#FF7043'
  },
  {
    label: 'deep-orange-6',
    value: 'deep-orange-6',
    size: '25px',
    name: 'circle',
    color: 'deep-orange-6',
    hexValue: '#FF5722'
  },
  {
    label: 'deep-orange-7',
    value: 'deep-orange-7',
    size: '25px',
    name: 'circle',
    color: 'deep-orange-7',
    hexValue: '#F4511E'
  },
  {
    label: 'deep-orange-8',
    value: 'deep-orange-8',
    size: '25px',
    name: 'circle',
    color: 'deep-orange-8',
    hexValue: '#E64A19'
  },
  {
    label: 'deep-orange-9',
    value: 'deep-orange-9',
    size: '25px',
    name: 'circle',
    color: 'deep-orange-9',
    hexValue: '#D84315'
  },
  {
    label: 'deep-orange-10',
    value: 'deep-orange-10',
    size: '25px',
    name: 'circle',
    color: 'deep-orange-10',
    hexValue: '#BF360C'
  },
  {
    label: 'deep-orange-11',
    value: 'deep-orange-11',
    size: '25px',
    name: 'circle',
    color: 'deep-orange-11',
    hexValue: '#FF9E80'
  },
  {
    label: 'deep-orange-12',
    value: 'deep-orange-12',
    size: '25px',
    name: 'circle',
    color: 'deep-orange-12',
    hexValue: '#FF6E40'
  },
  {
    label: 'deep-orange-13',
    value: 'deep-orange-13',
    size: '25px',
    name: 'circle',
    color: 'deep-orange-13',
    hexValue: '#FF3D00'
  },
  {
    label: 'deep-orange-14',
    value: 'deep-orange-14',
    size: '25px',
    name: 'circle',
    color: 'deep-orange-14',
    hexValue: '#DD2C00'
  },
//   {
//     label: 'brown',
//     value: 'brown',
//     size: '25px',
//     name: 'circle',
//     color: 'brown',
//     hexValue: '#'
//   },
  {
    label: 'brown-1',
    value: 'brown-1',
    size: '25px',
    name: 'circle',
    color: 'brown-1',
    hexValue: '#EFEBE9'
  },
  {
    label: 'brown-2',
    value: 'brown-2',
    size: '25px',
    name: 'circle',
    color: 'brown-2',
    hexValue: '#D7CCC8'
  },
  {
    label: 'brown-3',
    value: 'brown-3',
    size: '25px',
    name: 'circle',
    color: 'brown-3',
    hexValue: '#BCAAA4'
  },
  {
    label: 'brown-4',
    value: 'brown-4',
    size: '25px',
    name: 'circle',
    color: 'brown-4',
    hexValue: '#A1887F'
  },
  {
    label: 'brown-5',
    value: 'brown-5',
    size: '25px',
    name: 'circle',
    color: 'brown-5',
    hexValue: '#8D6E63'
  },
  {
    label: 'brown-6',
    value: 'brown-6',
    size: '25px',
    name: 'circle',
    color: 'brown-6',
    hexValue: '#795548'
  },
  {
    label: 'brown-7',
    value: 'brown-7',
    size: '25px',
    name: 'circle',
    color: 'brown-7',
    hexValue: '#6D4C41'
  },
  {
    label: 'brown-8',
    value: 'brown-8',
    size: '25px',
    name: 'circle',
    color: 'brown-8',
    hexValue: '#5D4037'
  },
  {
    label: 'brown-9',
    value: 'brown-9',
    size: '25px',
    name: 'circle',
    color: 'brown-9',
    hexValue: '#4E342E'
  },
  {
    label: 'brown-10',
    value: 'brown-10',
    size: '25px',
    name: 'circle',
    color: 'brown-10',
    hexValue: '#3E2723'
  },
//   {
//     label: 'brown-11',
//     value: 'brown-11',
//     size: '25px',
//     name: 'circle',
//     color: 'brown-11',
//     hexValue: '#'
//   },
//   {
//     label: 'brown-12',
//     value: 'brown-12',
//     size: '25px',
//     name: 'circle',
//     color: 'brown-12',
//     hexValue: '#'
//   },
//   {
//     label: 'brown-13',
//     value: 'brown-13',
//     size: '25px',
//     name: 'circle',
//     color: 'brown-13',
//     hexValue: '#'
//   },
//   {
//     label: 'brown-14',
//     value: 'brown-14',
//     size: '25px',
//     name: 'circle',
//     color: 'brown-14',
//     hexValue: '#'
//   },
//   {
//     label: 'grey',
//     value: 'grey',
//     size: '25px',
//     name: 'circle',
//     color: 'grey',
//     hexValue: '#'
//   },
  {
    label: 'grey-1',
    value: 'grey-1',
    size: '25px',
    name: 'circle',
    color: 'grey-1',
    hexValue: '#FAFAFA'
  },
  {
    label: 'grey-2',
    value: 'grey-2',
    size: '25px',
    name: 'circle',
    color: 'grey-2',
    hexValue: '#F5F5F5'
  },
  {
    label: 'grey-3',
    value: 'grey-3',
    size: '25px',
    name: 'circle',
    color: 'grey-3',
    hexValue: '#EEEEEE'
  },
  {
    label: 'grey-4',
    value: 'grey-4',
    size: '25px',
    name: 'circle',
    color: 'grey-4',
    hexValue: '#E0E0E0'
  },
  {
    label: 'grey-5',
    value: 'grey-5',
    size: '25px',
    name: 'circle',
    color: 'grey-5',
    hexValue: '#BDBDBD'
  },
  {
    label: 'grey-6',
    value: 'grey-6',
    size: '25px',
    name: 'circle',
    color: 'grey-6',
    hexValue: '#9E9E9E'
  },
  {
    label: 'grey-7',
    value: 'grey-7',
    size: '25px',
    name: 'circle',
    color: 'grey-7',
    hexValue: '#757575'
  },
  {
    label: 'grey-8',
    value: 'grey-8',
    size: '25px',
    name: 'circle',
    color: 'grey-8',
    hexValue: '#616161'
  },
  {
    label: 'grey-9',
    value: 'grey-9',
    size: '25px',
    name: 'circle',
    color: 'grey-9',
    hexValue: '#424242'
  },
  {
    label: 'grey-10',
    value: 'grey-10',
    size: '25px',
    name: 'circle',
    color: 'grey-10',
    hexValue: '#212121'
  },
//   {
//     label: 'grey-11',
//     value: 'grey-11',
//     size: '25px',
//     name: 'circle',
//     color: 'grey-11',
//     hexValue: '#'
//   },
//   {
//     label: 'grey-12',
//     value: 'grey-12',
//     size: '25px',
//     name: 'circle',
//     color: 'grey-12',
//     hexValue: '#'
//   },
//   {
//     label: 'grey-13',
//     value: 'grey-13',
//     size: '25px',
//     name: 'circle',
//     color: 'grey-13',
//     hexValue: '#'
//   },
//   {
//     label: 'grey-14',
//     value: 'grey-14',
//     size: '25px',
//     name: 'circle',
//     color: 'grey-14',
//     hexValue: '#'
//   },
//   {
//     label: 'blue-grey',
//     value: 'blue-grey',
//     size: '25px',
//     name: 'circle',
//     color: 'blue-grey',
//     hexValue: '#'
//   },
  {
    label: 'blue-grey-1',
    value: 'blue-grey-1',
    size: '25px',
    name: 'circle',
    color: 'blue-grey-1',
    hexValue: '#ECEFF1'
  },
  {
    label: 'blue-grey-2',
    value: 'blue-grey-2',
    size: '25px',
    name: 'circle',
    color: 'blue-grey-2',
    hexValue: '#CFD8DC'
  },
  {
    label: 'blue-grey-3',
    value: 'blue-grey-3',
    size: '25px',
    name: 'circle',
    color: 'blue-grey-3',
    hexValue: '#B0BEC5'
  },
  {
    label: 'blue-grey-4',
    value: 'blue-grey-4',
    size: '25px',
    name: 'circle',
    color: 'blue-grey-4',
    hexValue: '#90A4AE'
  },
  {
    label: 'blue-grey-5',
    value: 'blue-grey-5',
    size: '25px',
    name: 'circle',
    color: 'blue-grey-5',
    hexValue: '#78909C'
  },
  {
    label: 'blue-grey-6',
    value: 'blue-grey-6',
    size: '25px',
    name: 'circle',
    color: 'blue-grey-6',
    hexValue: '#607D8B'
  },
  {
    label: 'blue-grey-7',
    value: 'blue-grey-7',
    size: '25px',
    name: 'circle',
    color: 'blue-grey-7',
    hexValue: '#546E7A'
  },
  {
    label: 'blue-grey-8',
    value: 'blue-grey-8',
    size: '25px',
    name: 'circle',
    color: 'blue-grey-8',
    hexValue: '#455A64'
  },
  {
    label: 'blue-grey-9',
    value: 'blue-grey-9',
    size: '25px',
    name: 'circle',
    color: 'blue-grey-9',
    hexValue: '#37474F'
  },
  {
    label: 'blue-grey-10',
    value: 'blue-grey-10',
    size: '25px',
    name: 'circle',
    color: 'blue-grey-10',
    hexValue: '#263238'
  },
//   {
//     label: 'blue-grey-11',
//     value: 'blue-grey-11',
//     size: '25px',
//     name: 'circle',
//     color: 'blue-grey-11',
//     hexValue: '#'
//   },
//   {
//     label: 'blue-grey-12',
//     value: 'blue-grey-12',
//     size: '25px',
//     name: 'circle',
//     color: 'blue-grey-12',
//     hexValue: '#'
//   },
//   {
//     label: 'blue-grey-13',
//     value: 'blue-grey-13',
//     size: '25px',
//     name: 'circle',
//     color: 'blue-grey-13',
//     hexValue: '#'
//   },
//   {
//     label: 'blue-grey-14',
//     value: 'blue-grey-14',
//     size: '25px',
//     name: 'circle',
//     color: 'blue-grey-14',
//     hexValue: '#'
//   }
]

export const colorPaletteDict = keyBy(colorPaletteListForCalendar.map(cp => {
  return {
    id: cp.label,
    value: cp.hexValue
  }
}), 'id')
