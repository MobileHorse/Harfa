import {
    FETCHING_GENERAL_INFO,
    FETCHED_GENERAL_INFO,
    FETCHING_GENERAL_INFO_ERROR,
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

const initialState = {
    usersCoordinates: {latitude: 0, longitude: 0},
    othersCoordinates: {},
    coordinatesFetched: false,
    fetchingCoordinates: false,
    fetched: false,
    fetching: false,
    error: null,
    online: false,
    OnlineUsers: {},
    connectivityAvailable: false,
    coordinatesError: null
}

const generalReducer = (state=initialState, action) => {
    switch(action.type){
        case FETCHING_GENERAL_INFO: 
            return {
                ...state,
                fetching: true,
                fetched: false,
                error: null
            }
        case FETCHED_GENERAL_INFO: 
            return{
                ...state,
                fetched: true,
                generalInfo: action.payload,
                fetching: false,
                error: null
            }
        case FETCHING_GENERAL_INFO_ERROR:
            return {
                ...state,
                fetched: false,
                fetching: false,
                error: action.payload
            }
        case FETCHING_COORDINATES: 
            return {
                ...state,
                fetchingCoordinates: true,
                coordinatesFetched: false,
            }
        case FETCHED_COORDINATES: 
            return {
                ...state,
                fetchingCoordinates: false,
                coordinatesFetched: true,
                usersCoordinates: action.payload
            }
        case FETCHING_COORDINATES_ERROR: {
            return {
                ...state,
                fetchingCoordinates: false,
                coordinatesFetched: false,
                coordinatesError: action.payload
            }
        }
        case FETCHING_OTHERS_COORDINATES: 
            return {
                ...state,
                fetchingCoordinates: true,
                coordinatesFetched: false,
            }
        case FETCHED_OTHERS_COORDINATES: 
            return {
                ...state,
                fetchingCoordinates: false,
                coordinatesFetched: true,
                othersCoordinates: action.payload
            }
        case FETCHING_OTHERS_COORDINATES_ERROR: {
            return {
                ...state,
                fetchingCoordinates: false,
                coordinatesFetched: false,
                coordinatesError: action.payload
            }
        }
        case UPDATE_ONLINE_STATUS: 
            return {
                ...state,
                online: action.payload
            }
        case UPDATE_CONNECTIVITY_STATUS: 
            return {
                ...state,
                connectivityAvailable: action.payload
            }
        case UPDATE_LIVE_CHAT_USERS: 
            return {
                ...state,
                OnlineUsers: action.payload
            }
        default: 
            return {
                ...state
            }
    }
}

export default generalReducer;