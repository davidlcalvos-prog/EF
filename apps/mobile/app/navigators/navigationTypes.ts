import { ComponentProps } from "react"
import { BottomTabScreenProps } from "@react-navigation/bottom-tabs"
import {
  CompositeScreenProps,
  NavigationContainer,
  NavigatorScreenParams,
} from "@react-navigation/native"
import { NativeStackScreenProps } from "@react-navigation/native-stack"

import type { PhysicalTestId } from "@/data/mockPlayerProfile"

// Demo Tab Navigator types
export type DemoTabParamList = {
  DemoCommunity: undefined
  DemoShowroom: { queryIndex?: string; itemIndex?: string }
  DemoDebug: undefined
  DemoPodcastList: undefined
}

// App Stack Navigator types
export type AppStackParamList = {
  Feed: undefined
  Profile: undefined
  ProfileEdit: undefined
  PsychologicalTest: undefined
  PhysicalTestSession: { testId: PhysicalTestId }
  Groups: undefined
  GroupDetail: { groupId: string }
  GroupFriends: { groupId: string }
  Matches: { groupId?: string } | undefined
  MatchDetail: { matchId: string }
  Reservations: { matchId?: string } | undefined
  ReservationDetail: { reservationId: string }
  Login: undefined
  Register: undefined
  Demo: NavigatorScreenParams<DemoTabParamList>
  // 🔥 Your screens go here
  // IGNITE_GENERATOR_ANCHOR_APP_STACK_PARAM_LIST
}

export type AppStackScreenProps<T extends keyof AppStackParamList> = NativeStackScreenProps<
  AppStackParamList,
  T
>

export type DemoTabScreenProps<T extends keyof DemoTabParamList> = CompositeScreenProps<
  BottomTabScreenProps<DemoTabParamList, T>,
  AppStackScreenProps<keyof AppStackParamList>
>

export interface NavigationProps extends Partial<
  ComponentProps<typeof NavigationContainer<AppStackParamList>>
> {}
