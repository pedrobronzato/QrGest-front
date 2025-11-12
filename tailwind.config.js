import gluestackPlugin from '@gluestack-ui/nativewind-utils/tailwind-plugin';

module.exports = {
  darkMode: "media",
  content: ["app/**/*.{tsx,jsx,ts,js}", "components/**/*.{tsx,jsx,ts,js}"],
  presets: [require('nativewind/preset')],
  safelist: [
    {
      pattern:
        /(bg|border|text|stroke|fill)-(primary|secondary|tertiary|error|success|warning|info|typography|outline|background|indicator)-(0|50|100|200|300|400|500|600|700|800|900|950|white|gray|black|error|warning|muted|success|info|light|dark|primary)/,
    },
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#005DFF',
          100: '#E0ECFF',
          200: '#B3CDFF',
          300: '#80ABFF',
          400: '#4D88FF',
          500: '#005DFF',
          600: '#004BCC',
          700: '#003999',
          800: '#002766',
          900: '#001433',
        },
        neutral: {
          DEFAULT: '#2F2F2F',
          100: '#E5E5E5',
          200: '#CCCCCC',
          300: '#B2B2B2',
          400: '#999999',
          500: '#808080',
          600: '#666666',
          700: '#4D4D4D',
          800: '#2F2F2F',
          900: '#1A1A1A',
        },
        background: {
          DEFAULT: '#F5F7FA',
        },
        success: {
          DEFAULT: '#00D26A',
          100: '#CCF5E3',
          200: '#99EBC7',
          300: '#66E2AB',
          400: '#33D88F',
          500: '#00D26A',
          600: '#00A757',
          700: '#007C43',
          800: '#00522F',
          900: '#00271B',
        },
        white: '#FFFFFF',
        black: '#000000',
      },
      fontFamily: {
        sans: ['Inter_400Regular'],
        heading: ['Montserrat_700Bold'],
        body: ['Inter_400Regular'],
      },
      fontWeight: {
        extrablack: '950',
      },
      fontSize: {
        '2xs': '10px',
      },
      boxShadow: {
        'hard-1': '-2px 2px 8px 0px rgba(38, 38, 38, 0.20)',
        'hard-2': '0px 3px 10px 0px rgba(38, 38, 38, 0.20)',
        'hard-3': '2px 2px 8px 0px rgba(38, 38, 38, 0.20)',
        'hard-4': '0px -3px 10px 0px rgba(38, 38, 38, 0.20)',
        'hard-5': '0px 2px 10px 0px rgba(38, 38, 38, 0.10)',
        'soft-1': '0px 0px 10px rgba(38, 38, 38, 0.1)',
        'soft-2': '0px 0px 20px rgba(38, 38, 38, 0.2)',
        'soft-3': '0px 0px 30px rgba(38, 38, 38, 0.1)',
        'soft-4': '0px 0px 40px rgba(38, 38, 38, 0.1)',
      },
    },
  },
  plugins: [gluestackPlugin],
};
