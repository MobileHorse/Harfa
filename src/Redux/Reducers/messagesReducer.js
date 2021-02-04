import {
    FETCHED_MESSAGES,
    FETCHING_MESSAGES,
    FETCHING_MESSAGES_ERROR
} from '../types';

const initialState = {
    dataChatSource: {},
    fetched: false,
    fetching: false,
    error: null
}

const messagesReducer = (state=initialState, action) => {
    switch(action.type){
        case FETCHING_MESSAGES: 
            return {
                ...state,
                feching: true,
                fetched: false,
                error: null
            }
        case FETCHED_MESSAGES: 
            return {
                ...state,
                dataChatSource: action.payload,
                fetched: true,
                fetching: false,
                error: null
            }
        case FETCHING_MESSAGES_ERROR: 
            return {
                ...state,
                error: action.payload,
                fetched: false,
                fetching: false
            }
        default: 
            return {
                ...state
            }
    }
}

export default messagesReducer;