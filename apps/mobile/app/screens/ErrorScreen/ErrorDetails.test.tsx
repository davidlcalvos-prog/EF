import { fireEvent, render } from "@testing-library/react-native"
import { SafeAreaProvider } from "react-native-safe-area-context"

import { ErrorDetails } from "./ErrorDetails"

jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }))

const metrics = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
}

const error = new Error("Boom de prueba")
const errorInfo = { componentStack: "\n    in FeedScreen\n    in AppStack" }

function renderScreen(onReset = jest.fn()) {
  return render(
    <SafeAreaProvider initialMetrics={metrics}>
      <ErrorDetails error={error} errorInfo={errorInfo} onReset={onReset} />
    </SafeAreaProvider>,
  )
}

const devFlag = global as unknown as { __DEV__: boolean }
let originalDev: boolean

beforeEach(() => {
  originalDev = devFlag.__DEV__
})

afterEach(() => {
  devFlag.__DEV__ = originalDev
})

describe("ErrorDetails", () => {
  it("en producción (__DEV__ = false) no muestra el mensaje del error ni el stack", () => {
    devFlag.__DEV__ = false
    const { queryByTestId, queryByText, getByTestId } = renderScreen()
    expect(queryByTestId("error-details-message")).toBeNull()
    expect(queryByTestId("error-details-stack")).toBeNull()
    expect(queryByText(/Boom de prueba/)).toBeNull()
    expect(queryByText(/in FeedScreen/)).toBeNull()
    expect(getByTestId("error-details-reset")).toBeTruthy()
  })

  it("en desarrollo (__DEV__ = true) muestra el mensaje y el stack de componentes", () => {
    devFlag.__DEV__ = true
    const { getByText } = renderScreen()
    expect(getByText(/Boom de prueba/)).toBeTruthy()
    expect(getByText(/in FeedScreen/)).toBeTruthy()
  })

  it("el botón llama a onReset (resetea el boundary, no reinicia la app)", () => {
    devFlag.__DEV__ = false
    const onReset = jest.fn()
    const { getByTestId } = renderScreen(onReset)
    fireEvent.press(getByTestId("error-details-reset"))
    expect(onReset).toHaveBeenCalledTimes(1)
  })
})
