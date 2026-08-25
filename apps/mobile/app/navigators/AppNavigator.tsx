/**
 * The app navigator (formerly "AppNavigator" and "MainNavigator") is used for the primary
 * navigation flows of your app.
 * Generally speaking, it will contain an auth flow (registration, login, forgot password)
 * and a "main" flow which the user will use once logged in.
 */
import { NavigationContainer } from "@react-navigation/native"
import { createNativeStackNavigator } from "@react-navigation/native-stack"

import Config from "@/config"
import { useAuth } from "@/context/AuthContext"
import { LoginScreen } from "@/screens/auth/LoginScreen"
import { RegisterScreen } from "@/screens/auth/RegisterScreen"
import { ErrorBoundary } from "@/screens/ErrorScreen/ErrorBoundary"
import { FeedScreen } from "@/screens/feed/FeedScreen"
import { GroupDetailScreen } from "@/screens/groups/GroupDetailScreen"
import { GroupFriendsScreen } from "@/screens/groups/GroupFriendsScreen"
import { GroupsScreen } from "@/screens/groups/GroupsScreen"
import { MatchDetailScreen } from "@/screens/matches/MatchDetailScreen"
import { MatchesScreen } from "@/screens/matches/MatchesScreen"
import { PhysicalTestSessionScreen } from "@/screens/profile/PhysicalTestSessionScreen"
import { ProfileEditScreen } from "@/screens/profile/ProfileEditScreen"
import { ProfileScreen } from "@/screens/profile/ProfileScreen"
import { PsychologicalTestScreen } from "@/screens/profile/PsychologicalTestScreen"
import { ReservationDetailScreen } from "@/screens/reservations/ReservationDetailScreen"
import { ReservationsScreen } from "@/screens/reservations/ReservationsScreen"
import { TournamentDetailScreen } from "@/screens/tournaments/TournamentDetailScreen"
import { TournamentRankingsScreen } from "@/screens/tournaments/TournamentRankingsScreen"
import { TournamentsScreen } from "@/screens/tournaments/TournamentsScreen"
import { useAppTheme } from "@/theme/context"
import { eliteForgeColors } from "@/theme/eliteForgeColors"

import { DemoNavigator } from "./DemoNavigator"
import type { AppStackParamList, NavigationProps } from "./navigationTypes"
import { navigationRef, useBackButtonHandler } from "./navigationUtilities"

/**
 * This is a list of all the route names that will exit the app if the back button
 * is pressed while in that screen. Only affects Android.
 */
const exitRoutes = Config.exitRoutes

// Documentation: https://reactnavigation.org/docs/stack-navigator/
const Stack = createNativeStackNavigator<AppStackParamList>()

const AppStack = () => {
  const { isAuthenticated } = useAuth()

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        navigationBarColor: eliteForgeColors.carbon,
        contentStyle: {
          backgroundColor: eliteForgeColors.carbon,
        },
      }}
      initialRouteName={isAuthenticated ? "Feed" : "Login"}
    >
      {isAuthenticated ? (
        <>
          <Stack.Screen name="Feed" component={FeedScreen} />
          <Stack.Screen name="Profile" component={ProfileScreen} />
          <Stack.Screen name="ProfileEdit" component={ProfileEditScreen} />
          <Stack.Screen name="PsychologicalTest" component={PsychologicalTestScreen} />
          <Stack.Screen name="PhysicalTestSession" component={PhysicalTestSessionScreen} />
          <Stack.Screen name="Groups" component={GroupsScreen} />
          <Stack.Screen name="GroupDetail" component={GroupDetailScreen} />
          <Stack.Screen name="GroupFriends" component={GroupFriendsScreen} />
          <Stack.Screen name="Matches" component={MatchesScreen} />
          <Stack.Screen name="MatchDetail" component={MatchDetailScreen} />
          <Stack.Screen name="Reservations" component={ReservationsScreen} />
          <Stack.Screen name="ReservationDetail" component={ReservationDetailScreen} />
          <Stack.Screen name="Tournaments" component={TournamentsScreen} />
          <Stack.Screen name="TournamentDetail" component={TournamentDetailScreen} />
          <Stack.Screen name="TournamentRankings" component={TournamentRankingsScreen} />

          <Stack.Screen name="Demo" component={DemoNavigator} />
        </>
      ) : (
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
        </>
      )}

      {/** 🔥 Your screens go here */}
      {/* IGNITE_GENERATOR_ANCHOR_APP_STACK_SCREENS */}
    </Stack.Navigator>
  )
}

export const AppNavigator = (props: NavigationProps) => {
  const { navigationTheme } = useAppTheme()

  useBackButtonHandler((routeName) => exitRoutes.includes(routeName))

  return (
    <NavigationContainer ref={navigationRef} theme={navigationTheme} {...props}>
      <ErrorBoundary catchErrors={Config.catchErrors}>
        <AppStack />
      </ErrorBoundary>
    </NavigationContainer>
  )
}
