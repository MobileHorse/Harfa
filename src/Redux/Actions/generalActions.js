import {
    FETCHED_COORDINATES,
    FETCHING_COORDINATES,
    FETCHING_COORDINATES_ERROR,
    FETCHING_OTHERS_COORDINATES,
    FETCHED_OTHERS_COORDINATES,
    FETCHING_OTHERS_COORDINATES_ERROR,
    UPDATE_ONLINE_STATUS,
    UPDATE_CONNECTIVITY_STATUS,
    UPDATE_LIVE_CHAT_USERS
} from '../types';

export const updatingCoordinates = () => {
    return {
        type: FETCHING_COORDINATES
    }
}

export const updateCoordinates = payload => {
    return {
        type: FETCHED_COORDINATES,
        payload
    }
}

export const updateCoordinatesError = payload => {
    return {
        type: FETCHING_COORDINATES_ERROR,
        payload
    }
}

export const updatingOthersCoordinates = () => {
    return {
        type: FETCHING_OTHERS_COORDINATES
    }
}

export const updateOthersCoordinates = payload => {
    return {
        type: FETCHED_OTHERS_COORDINATES,
        payload
    }
}

export const updateOthersCoordinatesError = payload => {
    return {
        type: FETCHING_OTHERS_COORDINATES_ERROR,
        payload
    }
}

export const updateOnlineStatus = payload => {
    return {
        type: UPDATE_ONLINE_STATUS,
        payload
    }
}

export const updateConnectivityStatus = payload => {
    return {
        type: UPDATE_CONNECTIVITY_STATUS,
        payload
    }
}

export const updateLiveChatUsers = payload => {
    return {
        type: UPDATE_LIVE_CHAT_USERS,
        payload
    }
}