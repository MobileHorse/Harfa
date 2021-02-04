import {
    FETCHING_NOTIFICATIONS,
    FETCHED_NOTIFICATIONS,
    FETCHING_NOTIFICATIONS_ERROR
} from '../types';

const initialState = {
    messages: 0,
    adminMessages: 0,
    generic: 0,
    messagesFetched: false,
    messagesFetching: false,
    messagesError: null,
    adminMessagesFetched: false,
    adminMessagesFetching: false,
    adminMessagesError: null,
    genericFetched: false,
    genericFetching: false,
    genericError: null
};

const notificationReducer = (state=initialState, action) => {
    switch(action.type){
        case FETCHING_NOTIFICATIONS: 
            return Object.assign({}, state, {
                [`${action.payload.type}Fetching`]: true,
                [`${action.payload.type}Fetched`]: false,
                [`${action.payload.type}Error`]: null,
            })
        case FETCHED_NOTIFICATIONS:
            return Object.assign({}, state, {
                [`${action.payload.type}Fetched`]: true,
                [action.payload.type]: action.payload.value,
                [`${action.payload.type}Error`]: null,
                [`${action.payload.type}Fetching`]: false
            })
        case FETCHING_NOTIFICATIONS_ERROR:
            return Object.assign({}, state, {
                ...state,
                [`${action.payload.type}Error`]: action.payload.error,
                [`${action.payload.type}Fetched`]: false,
                [`${action.payload.type}Fetching`]: false
            })
        default: 
            return {
                ...state
            }
    }
}

export default notificationReducer;