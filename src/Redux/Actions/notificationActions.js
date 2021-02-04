import {
    FETCHING_NOTIFICATIONS,
    FETCHED_NOTIFICATIONS,
    FETCHING_NOTIFICATIONS_ERROR
} from '../types';

export const startFetchingNotification = payload => {
    return {
      type: FETCHING_NOTIFICATIONS,
      payload
    }
}

export const notificationsFetched = payload => {
    return {
      type: FETCHED_NOTIFICATIONS,
      payload
    }
}

export const notificationError = payload => {
    return {
      type: FETCHING_NOTIFICATIONS_ERROR,
      payload
    }
}