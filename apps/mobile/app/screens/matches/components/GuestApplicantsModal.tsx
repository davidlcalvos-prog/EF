import { useState } from "react"
import { Modal, Pressable, ScrollView, View } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { Text, XStack, YStack } from "tamagui"

import { useResponsiveLayout } from "@/hooks/useResponsiveLayout"
import { translate } from "@/i18n/translate"
import { GroupAvatar } from "@/screens/groups/components/GroupAvatar"
import { MemberProfileModal } from "@/screens/groups/components/MemberProfileModal"
import { getPositionLabel } from "@/screens/profile/components/ProfileHeader"
import type { MatchGuestApplicationApiDto } from "@/services/api"
import { eliteForgeColors } from "@/theme/eliteForgeColors"

export interface GuestApplicantsModalProps {
  visible: boolean
  onClose: () => void
  applications: MatchGuestApplicationApiDto[]
  onAccept: (applicationId: string) => Promise<boolean>
  onReject: (applicationId: string) => Promise<boolean>
}

/**
 * Lista de postulantes al comodín (Fase 11), solo para el líder/vice. La
 * ficha se abre con source="guest_application" — MemberProfileModal ya
 * decide con esa regla si el postulante muestra stats (candado salvo que
 * ya sean amigos), sin tocar esa lógica acá.
 */
export function GuestApplicantsModal({
  visible,
  onClose,
  applications,
  onAccept,
  onReject,
}: GuestApplicantsModalProps) {
  const { insets } = useResponsiveLayout()
  const [busyId, setBusyId] = useState<string | null>(null)
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)

  const selectedApplication = applications.find((a) => a.user.id === selectedUserId) ?? null

  const handleAccept = async (applicationId: string) => {
    setBusyId(applicationId)
    await onAccept(applicationId)
    setBusyId(null)
  }

  const handleReject = async (applicationId: string) => {
    setBusyId(applicationId)
    await onReject(applicationId)
    setBusyId(null)
  }

  return (
    <>
      <Modal
        visible={visible}
        animationType="fade"
        transparent
        onRequestClose={onClose}
        statusBarTranslucent
      >
        <View style={{ flex: 1 }}>
          <Pressable
            style={{
              position: "absolute",
              top: 0,
              right: 0,
              bottom: 0,
              left: 0,
              backgroundColor: "rgba(0,0,0,0.4)",
            }}
            onPress={onClose}
            accessibilityLabel="Cerrar"
          />

          <View
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: 0,
              maxHeight: "85%",
              backgroundColor: eliteForgeColors.carbonElevated,
              borderTopLeftRadius: 16,
              borderTopRightRadius: 16,
              borderWidth: 1,
              borderColor: eliteForgeColors.carbonBorder,
              overflow: "hidden",
            }}
          >
            <XStack height={2} width="100%">
              <YStack flex={1} backgroundColor={eliteForgeColors.emerald} />
              <YStack flex={1} backgroundColor={eliteForgeColors.orange} />
            </XStack>

            <XStack
              alignItems="center"
              justifyContent="space-between"
              paddingHorizontal={12}
              paddingVertical={8}
              borderBottomWidth={1}
              borderBottomColor={eliteForgeColors.carbonBorder}
            >
              <Pressable
                onPress={onClose}
                hitSlop={10}
                accessibilityRole="button"
                accessibilityLabel={translate("feedScreen:composeCancel")}
              >
                <Ionicons name="close" size={20} color="#FFFFFF" />
              </Pressable>

              <Text color="#FFFFFF" fontWeight="800" fontSize={14}>
                {translate("matchesScreen:guestApplicantsTitle")}
              </Text>

              <XStack width={20} />
            </XStack>

            <ScrollView
              contentContainerStyle={{
                paddingHorizontal: 16,
                paddingTop: 14,
                paddingBottom: Math.max(insets.bottom, 16),
              }}
            >
              {applications.length === 0 ? (
                <Text color="rgba(255,255,255,0.45)" fontSize={13} textAlign="center">
                  {translate("matchesScreen:guestApplicantsEmpty")}
                </Text>
              ) : (
                applications.map((application) => {
                  const busy = busyId === application.id
                  const positionLabel = application.user.favoritePosition
                    ? getPositionLabel(
                        application.user.favoritePosition as Parameters<typeof getPositionLabel>[0],
                      )
                    : null

                  return (
                    <XStack
                      key={application.id}
                      alignItems="center"
                      gap={12}
                      paddingVertical={10}
                      borderBottomWidth={1}
                      borderBottomColor="rgba(85,85,85,0.5)"
                    >
                      <Pressable
                        onPress={() => setSelectedUserId(application.user.id)}
                        accessibilityRole="button"
                        style={{ flex: 1 }}
                      >
                        <XStack alignItems="center" gap={12}>
                          <GroupAvatar
                            seed={application.user.id}
                            name={application.user.displayName}
                            photoBase64={application.user.avatarBase64}
                            size={40}
                          />
                          <YStack flex={1}>
                            <Text color="#FFFFFF" fontWeight="700" fontSize={14} numberOfLines={1}>
                              {application.user.displayName}
                            </Text>
                            {positionLabel ? (
                              <Text color="rgba(255,255,255,0.5)" fontSize={12}>
                                {positionLabel}
                              </Text>
                            ) : null}
                          </YStack>
                        </XStack>
                      </Pressable>

                      {application.status === "pending" ? (
                        <XStack gap={8}>
                          <Pressable
                            onPress={() => handleAccept(application.id)}
                            disabled={busy}
                            accessibilityRole="button"
                          >
                            <XStack
                              width={36}
                              height={36}
                              borderRadius={10}
                              backgroundColor="rgba(0,206,200,0.15)"
                              borderWidth={1}
                              borderColor={eliteForgeColors.emerald}
                              alignItems="center"
                              justifyContent="center"
                              opacity={busy ? 0.5 : 1}
                            >
                              <Ionicons
                                name="checkmark"
                                size={18}
                                color={eliteForgeColors.emerald}
                              />
                            </XStack>
                          </Pressable>
                          <Pressable
                            onPress={() => handleReject(application.id)}
                            disabled={busy}
                            accessibilityRole="button"
                          >
                            <XStack
                              width={36}
                              height={36}
                              borderRadius={10}
                              backgroundColor="rgba(231,76,60,0.12)"
                              borderWidth={1}
                              borderColor="#E74C3C"
                              alignItems="center"
                              justifyContent="center"
                              opacity={busy ? 0.5 : 1}
                            >
                              <Ionicons name="close" size={18} color="#E74C3C" />
                            </XStack>
                          </Pressable>
                        </XStack>
                      ) : (
                        <Text color="rgba(255,255,255,0.4)" fontSize={12}>
                          {translate(`matchesScreen:guestApplicationStatus_${application.status}`)}
                        </Text>
                      )}
                    </XStack>
                  )
                })
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <MemberProfileModal
        visible={!!selectedApplication}
        onClose={() => setSelectedUserId(null)}
        userId={selectedApplication?.user.id ?? ""}
        source="guest_application"
        preview={
          selectedApplication
            ? {
                displayName: selectedApplication.user.displayName,
                alias: selectedApplication.user.alias,
                favoritePosition: selectedApplication.user.favoritePosition,
                avatarBase64: selectedApplication.user.avatarBase64,
              }
            : undefined
        }
      />
    </>
  )
}
