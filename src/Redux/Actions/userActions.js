import {
    UPDATE_PROVIDER_DETAILS,
    UPDATE_USER_DETAILS,
    UPDATE_NEW_USER_INFO,
    RESET_USER_DETAILS
} from '../types';

export const updateProviderDetails = payload => {
    return {
        type: UPDATE_PROVIDER_DETAILS,
        payload
    }
}

export const updateNewUserInfo = payload => {
    return {
        type: UPDATE_NEW_USER_INFO,
        payload
    }
}

export const updateUserDetails = payload => {
    return {
        type: UPDATE_USER_DETAILS,
        payload
    }
}

export const resetUserDetails = () => {
    return {
        type: RESET_USER_DETAILS
    }
}