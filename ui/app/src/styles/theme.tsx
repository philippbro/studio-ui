/*
 * Copyright (C) 2007-2019 Crafter Software Corporation. All Rights Reserved.
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

import createMuiTheme, { ThemeOptions } from '@material-ui/core/styles/createMuiTheme';
import { darken, fade } from '@material-ui/core/styles';

export const palette = {
  white: '#fff',
  black: '#000',
  blue: { tint: '#409CFF', main: '#007AFF', shade: '#0040DD' },
  green: { tint: '#30DB5B', main: '#34C759', shade: '#248A3D' },
  indigo: { tint: '#7D7AFF', main: '#5856D6', shade: '#3634A3' },
  orange: { tint: '#FFB340', main: '#FF9500', shade: '#C93400' },
  pink: { tint: '#FF6482', main: '#FF2D55', shade: '#D30F45' },
  purple: { tint: '#DA8FFF', main: '#AF52DE', shade: '#8944AB' },
  red: { tint: '#FF6961', main: '#FF3B30', shade: '#D70015' },
  teal: { tint: '#70D7FF', main: '#5AC8FA', shade: '#0071A4' },
  yellow: { tint: '#FFD426', main: '#FFCC00', shade: '#A05A00' },
  gray: {
    light0: '#FAFAFA',
    light1: '#F3F3F3',
    light2: '#F2F2F7',
    light3: '#EBEBF0',
    light4: '#E5E5EA',
    light5: '#D8D8DC',
    light6: '#D1D1D6',
    light7: '#C7C7CC',
    medium1: '#BCBCC0',
    medium2: '#AEAEB2',
    medium3: '#8E8E93',
    medium4: '#7C7C80',
    medium5: '#6C6C70',
    medium6: '#636366',
    medium7: '#545456',
    dark1: '#48484A',
    dark2: '#444446',
    dark3: '#3A3A3C',
    dark4: '#363638',
    dark5: '#2C2C2E',
    dark6: '#242426',
    dark7: '#1C1C1E'
  }
};

export const backgroundColor = palette.gray.light1;
export const RedColor = palette.red.main;

const defaultTheme = createMuiTheme();

export const themeOptions: ThemeOptions = {
  typography: {
    button: {
      textTransform: 'none'
    },
    fontSize: 14,
    fontFamily: '"Source Sans Pro", "Open Sans", sans-serif'
  },
  palette: {
    primary: {
      main: palette.blue.main,
      contrastText: '#FFFFFF'
    },
    text: {
      secondary: palette.gray.medium3
    },
    // type: 'dark'
  },
  overrides: {
    MuiFormLabel: {
      root: {
        transform: 'translate(0, 1.5px) scale(1) !important',
        transformOrigin: 'top left !important'
      },
      asterisk: {
        color: RedColor
      }
    },
    MuiInputBase: {
      root: {
        'label + &': {
          marginTop: `${defaultTheme.spacing(3)}px !important`
        },
        '&.MuiInput-underline::before': {
          display: 'none'
        },
        '&.MuiInput-underline::after': {
          display: 'none'
        },
        '&$error .MuiInputBase-input': {
          color: RedColor,
          borderColor: RedColor,
          '&:focus': {
            boxShadow: 'rgba(244, 67, 54, 0.25) 0 0 0 0.2rem'
          }

        },
        '&$multiline textarea': {
          padding: '10px 12px'
        }
      },
      input: {
        borderRadius: 4,
        position: 'relative',
        border: '1px solid #ced4da',
        fontSize: 16,
        width: '100%',
        padding: '10px 12px',
        transition: defaultTheme.transitions.create(['border-color', 'box-shadow']),
        '&:focus:invalid': {
          boxShadow: `${fade(palette.blue.main, 0.25)} 0 0 0 0.2rem`
        },
        '&:focus': {
          boxShadow: `${fade(palette.blue.main, 0.25)} 0 0 0 0.2rem`,
          borderColor: palette.blue.main
        }
      }
    },
    MuiTabs: {
      indicator: {
        backgroundColor: palette.blue.main
      }
    },
    MuiButton: {
      contained: {
        color: '#4F4F4F',
        backgroundColor: '#FFFFFF',
        textTransform: 'inherit',
        '&:hover': {
          backgroundColor: '#FFFFFF'
        }
      },
      outlinedPrimary: {
        color: darken(palette.blue.main, 0.10),
        border: `1px solid ${darken(palette.blue.main, 0.10)}`
      }
    }
  }
};

export const theme = createMuiTheme(themeOptions);
