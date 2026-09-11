import { ComponentProps } from "react"
import { NavigationContainer } from "@react-navigation/native"
import { NativeStackScreenProps } from "@react-navigation/native-stack"

import type { PhysicalTestId } from "@/data/mockPlayerProfile"

// App Stack Navigator types
export type AppStackParamList = {
  Feed: undefined
  Profile: undefined
  ProfileEdit: undefined
  PsychologicalTest: undefined
  PhysicalTestSession: { testId: PhysicalTestId }
  /** `initialSection` lo usa el deep link del push de invitación a grupo (utils/pushNavigation.ts). */
  Groups: { initialSection?: "invitations" } | undefined
  GroupDetail: { groupId: string }
  GroupFriends: { groupId: string }
  /** `initialTab` lo usa el deep link del push de solicitud de amistad (utils/pushNavigation.ts). */
  Friends: { initialTab?: "requests" } | undefined
  Matches: { groupId?: string } | undefined
  /** `openApplicants` lo usa el deep link del push "nuevo postulante a comodín". */
  MatchDetail: { matchId: string; openApplicants?: boolean }
  NearbyGuestRequests: undefined
  Reservations: { matchId?: string } | undefined
  ReservationDetail: { reservationId: string }
  Tournaments: undefined
  TournamentDetail: { tournamentId: string }
  TournamentRankings: { tournamentId: string; tournamentName: string }
  Login: undefined
  Register: undefined
  // 🔥 Your screens go here
  // IGNITE_GENERATOR_ANCHOR_APP_STACK_PARAM_LIST
}

export type AppStackScreenProps<T extends keyof AppStackParamList> = NativeStackScreenProps<
  AppStackParamList,
  T
>

export interface NavigationProps extends Partial<
  ComponentProps<typeof NavigationContainer<AppStackParamList>>
> {}
