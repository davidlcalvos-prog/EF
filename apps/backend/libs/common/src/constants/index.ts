export * from './roles';

export const SERVICE_NAMES = {
  AUTH: 'AUTH_SERVICE',
  USERS: 'USERS_SERVICE',
  VENUES: 'VENUES_SERVICE',
} as const;

export const MESSAGE_PATTERNS = {
  AUTH: {
    LOGIN: 'auth.login',
    VALIDATE_TOKEN: 'auth.validate_token',
    REGISTER: 'auth.register',
    GET_ME: 'auth.get_me',
  },
  USERS: {
    FIND_BY_ID: 'users.find_by_id',
    UPDATE_PROFILE: 'users.update_profile',
    GET_PREFERENCES: 'users.get_preferences',
    UPDATE_PREFERENCES: 'users.update_preferences',
  },
  VENUES: {
    LIST_MINE: 'venues.list_mine',
    UPSERT_MINE: 'venues.upsert_mine',
    LIST_RESERVATIONS_MINE: 'venues.list_reservations_mine',
    UPDATE_RESERVATION_STATUS: 'venues.update_reservation_status',
  },
  PROFILE_STATS: {
    GET_MINE: 'profile_stats.get_mine',
    SAVE_PHYSICAL_TEST_RESULT: 'profile_stats.save_physical_test_result',
    SAVE_PSYCH_ASSESSMENT: 'profile_stats.save_psych_assessment',
  },
} as const;
