import * as Colors from "@tamagui/colors";
import { createThemes, defaultComponentThemes } from "@tamagui/theme-builder";

const primaryPalette = [
    "hsl(174, 66%, 97%)",
    "hsl(174, 66%, 93%)",
    "hsl(174, 66%, 87%)",
    "hsl(174, 66%, 78%)",
    "hsl(174, 66%, 68%)",
    "hsl(174, 66%, 60%)",
    "hsl(174, 66%, 53%)",
    "hsl(174, 66%, 48%)",
    "hsl(174, 66%, 40%)",
    "hsl(174, 66%, 33%)",
    "hsl(174, 66%, 21%)",
    "hsl(174, 66%, 12%)",
];

const lightPalette = [
    "hsl(174, 6.6%, 98%)",
    "hsl(174, 6.6%, 96%)",
    "hsl(174, 6.6%, 90%)",
    "hsl(174, 6.6%, 84%)",
    "hsl(174, 6.6%, 65%)",
    "hsl(174, 6.6%, 46%)",
    "hsl(174, 6.6%, 34%)",
    "hsl(174, 6.6%, 26%)",
    "hsl(174, 6.6%, 16%)",
    "hsl(174, 6.6%, 10%)",
    "hsl(174, 6.6%, 8%)",
    "hsl(174, 6.6%, 4%)",
];

const darkPalette = [...lightPalette].reverse();

const lightShadows = {
    shadow1: "rgba(0,0,0,0.04)",
    shadow2: "rgba(0,0,0,0.08)",
    shadow3: "rgba(0,0,0,0.16)",
    shadow4: "rgba(0,0,0,0.24)",
    shadow5: "rgba(0,0,0,0.32)",
    shadow6: "rgba(0,0,0,0.4)",
};

const darkShadows = {
    shadow1: "rgba(0,0,0,0.2)",
    shadow2: "rgba(0,0,0,0.3)",
    shadow3: "rgba(0,0,0,0.4)",
    shadow4: "rgba(0,0,0,0.5)",
    shadow5: "rgba(0,0,0,0.6)",
    shadow6: "rgba(0,0,0,0.7)",
};

const builtThemes = createThemes({
    componentThemes: defaultComponentThemes,
    base: {
        palette: {
            dark: darkPalette,
            light: lightPalette,
        },

        extra: {
            light: {
                ...Colors.green,
                ...Colors.red,
                ...Colors.yellow,
                ...Colors.gray,
                ...lightShadows,
                shadowColor: lightShadows.shadow1,
            },
            dark: {
                ...Colors.greenDark,
                ...Colors.redDark,
                ...Colors.yellowDark,
                ...Colors.grayDark,
                ...darkShadows,
                shadowColor: darkShadows.shadow1,
            },
        },
    },
    accent: {
        palette: {
            dark: [...primaryPalette].reverse(),
            light: [...primaryPalette].reverse(),
        },
    },
    childrenThemes: {
        primary: {
            palette: {
                dark: [...primaryPalette].reverse(),
                light: [...primaryPalette].reverse(),
            },
        },
        gray: {
            palette: {
                dark: darkPalette,
                light: lightPalette,
            },
        },
        warning: {
            palette: {
                dark: Object.values(Colors.yellowDark),
                light: Object.values(Colors.yellow),
            },
        },
        error: {
            palette: {
                dark: Object.values(Colors.redDark),
                light: Object.values(Colors.red),
            },
        },
        success: {
            palette: {
                dark: Object.values(Colors.greenDark),
                light: Object.values(Colors.green),
            },
        },
    },
});

export type Themes = typeof builtThemes;

// the process.env conditional here is optional but saves web client-side bundle
// size by leaving out themes JS. tamagui automatically hydrates themes from CSS
// back into JS for you, and the bundler plugins set TAMAGUI_ENVIRONMENT. so
// long as you are using the Vite, Next, Webpack plugins this should just work,
// but if not you can just export builtThemes directly as themes:
export const themes: Themes =
    process.env.TAMAGUI_ENVIRONMENT === "client" && process.env.NODE_ENV === "production"
        ? ({} as any)
        : (builtThemes as any);
