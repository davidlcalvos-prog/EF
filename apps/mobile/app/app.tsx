/* eslint-disable import/first */
/**
 * Welcome to the main entry point of the app. In this file, we'll
 * be kicking off our app.
 *
 * Most of this file is boilerplate and you shouldn't need to modify
 * it very often. But take some time to look through and understand
 * what is going on here.
 *
 * The app navigation resides in ./app/navigators, so head over there
 * if you're interested in adding screens and navigators.
 */
if (__DEV__) {
  // Load Reactotron in development only.
  // Note that you must be using metro's `inlineRequires` for this to work.
  // If you turn it off in metro.config.js, you'll have to manually import it.
  require("./devtools/ReactotronConfig.ts")
}
import "./utils/gestureHandler"

import { useEffect, useState } from "react"
import { useFonts } from "expo-font"
import * as Linking from "expo-linking"
import { SystemBars } from "react-native-edge-to-edge"
import { KeyboardProvider } from "react-native-keyboard-controller"
import { initialWindowMetrics, SafeAreaProvider } from "react-native-safe-area-context"
import { TamaguiProvider } from "tamagui"

import { AppAlertProvider } from "./components/AppAlert"
import { AuthProvider } from "./context/AuthContext"
import { PendingProvider } from "./context/PendingContext"
import { initI18n } from "./i18n"
import tamaguiConfig from "../tamagui.config"
import { AppNavigator } from "./navigators/AppNavigator"
import { useNavigationPersistence } from "./navigators/navigationUtilities"
import { ThemeProvider } from "./theme/context"
import { customFontsToLoad } from "./theme/typography"
import { loadDateFnsLocale } from "./utils/formatDate"
import { handlePushResponse } from "./utils/pushNavigation"
import { addPushResponseListener, consumeLaunchNotificationData } from "./utils/pushNotifications"
import * as storage from "./utils/storage"

export const NAVIGATION_PERSISTENCE_KEY = "NAVIGATION_STATE"

// Web linking configuration
const prefix = Linking.createURL("/")
const config = {
  screens: {
    Login: {
      path: "",
    },
    Welcome: "welcome",
    Demo: {
      screens: {
        DemoShowroom: {
          path: "showroom/:queryIndex?/:itemIndex?",
        },
        DemoDebug: "debug",
        DemoPodcastList: "podcast",
        DemoCommunity: "community",
      },
    },
  },
}

/**
 * This is the root component of our app.
 * @param {AppProps} props - The props for the `App` component.
 * @returns {JSX.Element} The rendered `App` component.
 */
export function App() {
  const {
    initialNavigationState,
    onNavigationStateChange,
    isRestored: isNavigationStateRestored,
  } = useNavigationPersistence(storage, NAVIGATION_PERSISTENCE_KEY)

  const [areFontsLoaded, fontLoadError] = useFonts(customFontsToLoad)
  const [isI18nInitialized, setIsI18nInitialized] = useState(false)

  useEffect(() => {
    initI18n()
      .then(() => setIsI18nInitialized(true))
      .then(() => loadDateFnsLocale())
  }, [])

  // Deep link desde una notificación (Fase A). Un solo despachador para todos
  // los tipos; el destino lo declara el backend en `data` (PushData) y
  // utils/pushNavigation.ts lo valida contra su lista blanca.
  //  - App abierta / segundo plano: listener.
  //  - App cerrada: la respuesta que lanzó el proceso se lee una vez al
  //    arrancar; si el navegador todavía no está listo o no hay sesión, el
  //    destino queda en cola y lo consumen AppNavigator (onReady) y AppStack
  //    (al montar la rama autenticada).
  useEffect(() => {
    const subscription = addPushResponseListener(handlePushResponse)
    consumeLaunchNotificationData().then((data) => {
      if (data !== undefined) handlePushResponse(data)
    })
    return () => subscription.remove()
  }, [])

  // Before we show the app, we have to wait for our state to be ready.
  // In the meantime, don't render anything. This will be the background
  // color set in native by rootView's background color.
  // In iOS: application:didFinishLaunchingWithOptions:
  // In Android: https://stackoverflow.com/a/45838109/204044
  // You can replace with your own loading component if you wish.
  if (!isNavigationStateRestored || !isI18nInitialized || (!areFontsLoaded && !fontLoadError)) {
    return null
  }

  const linking = {
    prefixes: [prefix],
    config,
  }

  // otherwise, we're ready to render the app
  return (
    <TamaguiProvider config={tamaguiConfig} defaultTheme="dark">
      <SafeAreaProvider initialMetrics={initialWindowMetrics}>
        {/* Barras del sistema (estado + navegación) con íconos claros, UNA sola
            vez para toda la app: con edge-to-edge y navegación transparente,
            el <StatusBar> de react-native está deprecado y no gobierna la barra
            de navegación — que sobre el fondo carbón quedaba con íconos oscuros
            invisibles en teléfonos con 3 botones. La app es oscura de punta a
            punta, así que no hace falta variarlo por pantalla. */}
        <SystemBars style="light" />
        <KeyboardProvider>
          <AuthProvider>
            {/* Pendientes (Fase B): necesita el token de AuthProvider; llega por contexto al drawer y al botón hamburguesa. */}
            <PendingProvider>
              <ThemeProvider>
                <AppAlertProvider>
                  <AppNavigator
                    linking={linking}
                    initialState={initialNavigationState}
                    onStateChange={onNavigationStateChange}
                  />
                </AppAlertProvider>
              </ThemeProvider>
            </PendingProvider>
          </AuthProvider>
        </KeyboardProvider>
      </SafeAreaProvider>
    </TamaguiProvider>
  )
}
