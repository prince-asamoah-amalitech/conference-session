/**
 * Design tokens for the Conference Sessions admin area.
 *
 * Values are lifted from the handoff design system in
 * docs/designs/project/_ds/unified-experience-design-system-<id>/tokens/.
 * Primitive ramps mirror tokens/colors.css; the semantic groups
 * (page/surface/content/stroke/...) mirror the "Light Mode (Dark Blue)"
 * theme in tokens/themes/light-dark-blue.css, which is the default mode.
 *
 * @type {import('tailwindcss').Config}
 */
module.exports = {
  content: ['./src/**/*.{html,ts}'],
  theme: {
    extend: {
      colors: {
        /* ---- Primitive ramps ---- */
        navy: {
          50: '#E6EAEB',
          100: '#B2BCC2',
          200: '#8D9CA5',
          300: '#5A6F7C',
          400: '#395362',
          500: '#08283B',
          600: '#072436',
          700: '#061C2A',
          800: '#041620',
          900: '#031119',
        },
        orange: {
          50: '#FFEFE6',
          100: '#FFCCB0',
          200: '#FFB38A',
          300: '#FF9054',
          400: '#FF7B33',
          500: '#FF5A00',
          600: '#E85200',
          700: '#B54000',
          800: '#8C3200',
          900: '#6B2600',
        },
        gray: {
          50: '#ECECEB',
          100: '#C3C3C2',
          200: '#A6A6A4',
          300: '#7E7D7B',
          400: '#656461',
          500: '#3E3D3A',
          600: '#383835',
          700: '#2C2B29',
          800: '#222220',
          900: '#1A1A18',
        },
        light: {
          50: '#FDFDFD',
          100: '#FBFBFB',
          200: '#F7F7F7',
          300: '#E6E6E6',
          400: '#CFCFCF',
          500: '#B8B8B8',
          600: '#ADADAD',
          700: '#8A8A8A',
          800: '#676767',
          900: '#515151',
        },
        blue: {
          50: '#EFF7FE',
          100: '#CDE6FC',
          200: '#B4DAFB',
          300: '#92C9F9',
          400: '#7DBFF8',
          500: '#5DAFF6',
          600: '#559FE0',
          700: '#427CAF',
          800: '#336087',
          900: '#274A67',
        },
        green: {
          50: '#F3FAF7',
          100: '#DEF7EC',
          200: '#BCF0DA',
          300: '#84E1BC',
          400: '#31C48D',
          500: '#0E9F6E',
          600: '#057A55',
          700: '#046C4E',
          800: '#03543F',
          900: '#014737',
        },
        red: {
          50: '#FDF2F2',
          100: '#FDE8E8',
          200: '#FBD5D5',
          300: '#F8B4B4',
          400: '#F98080',
          500: '#F05252',
          600: '#E02424',
          700: '#C81E1E',
          800: '#9B1C1C',
          900: '#771D1D',
        },
        yellow: {
          50: '#FFF9E6',
          100: '#FFEBB0',
          200: '#FFE18A',
          300: '#FED354',
          400: '#FECB33',
          500: '#FEBE00',
          600: '#E7AD00',
          700: '#B48700',
          800: '#8C6900',
          900: '#6B5000',
        },
        purple: {
          50: '#F6F5FF',
          100: '#EDEBFE',
          200: '#DCD7FE',
          300: '#CABFFD',
          400: '#AC94FA',
          500: '#9061F9',
          600: '#7E3AF2',
          700: '#6C2BD9',
          800: '#5521B5',
          900: '#4A1D96',
        },

        /* ---- Semantic: surfaces ---- */
        page: '#F7F7F7',
        surface: {
          DEFAULT: '#FDFDFD',
          raised: '#FDFDFD',
          sunken: '#E6EAEB',
          inverse: '#08283B',
          hover: '#E6EAEB',
        },

        /* ---- Semantic: text ---- */
        content: {
          DEFAULT: '#08283B',
          secondary: '#395362',
          tertiary: '#5A6F7C',
          inverse: '#FDFDFD',
          placeholder: '#5A6F7C',
          danger: '#C81E1E',
        },

        /* ---- Semantic: strokes ---- */
        stroke: {
          light: '#E6EAEB',
          medium: '#B2BCC2',
          dark: '#5A6F7C',
          active: '#041620',
          danger: '#F05252',
        },
      },

      fontFamily: {
        display: ['Poppins', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        body: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        mono: ['ui-monospace', 'SF Mono', 'Menlo', 'Consolas', 'monospace'],
      },

      fontSize: {
        xxs: ['8px', '10.4px'],
        xs: ['12px', '15.6px'],
        sm: ['14px', '18.2px'],
        base: ['16px', '20.8px'],
        lg: ['18px', '23.4px'],
        xl: ['20px', '26px'],
        '2xl': ['24px', '31.2px'],
        '3xl': ['32px', '41.6px'],
        '4xl': ['36px', '46.8px'],
        '5xl': ['48px', '62.4px'],
      },

      fontWeight: {
        light: '300',
        regular: '400',
        medium: '500',
        semibold: '600',
        bold: '700',
        extrabold: '800',
      },

      letterSpacing: {
        tight: '-0.02em',
        normal: '0',
        wide: '0.04em',
        logo: '0.18em',
      },

      borderRadius: {
        sm: '2px',
        DEFAULT: '4px',
        md: '6px',
        lg: '8px',
        xl: '12px',
        '2xl': '16px',
        '3xl': '24px',
        full: '999px',
      },

      boxShadow: {
        xs: '0 1px 2px rgba(8, 40, 59, 0.06)',
        sm: '0 1px 3px rgba(8, 40, 59, 0.10), 0 1px 2px rgba(8, 40, 59, 0.06)',
        md: '0 4px 6px -1px rgba(8, 40, 59, 0.10), 0 2px 4px -1px rgba(8, 40, 59, 0.06)',
        lg: '0 10px 15px -3px rgba(8, 40, 59, 0.10), 0 4px 6px -2px rgba(8, 40, 59, 0.05)',
        xl: '0 20px 25px -5px rgba(8, 40, 59, 0.12), 0 10px 10px -5px rgba(8, 40, 59, 0.04)',
      },

      maxWidth: {
        container: '1024px',
        form: '768px',
      },

      transitionTimingFunction: {
        standard: 'cubic-bezier(0.4, 0, 0.2, 1)',
        out: 'cubic-bezier(0, 0, 0.2, 1)',
        in: 'cubic-bezier(0.4, 0, 1, 1)',
      },

      transitionDuration: {
        fast: '120ms',
        base: '180ms',
        DEFAULT: '180ms',
        slow: '280ms',
      },
    },
  },
  plugins: [],
};
