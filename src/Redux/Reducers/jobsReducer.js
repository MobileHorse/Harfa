import {
    FETCHING_JOB_REQUESTS,
    FETCHED_JOB_REQUESTS,
    FETCHING_JOB_REQUESTS_ERROR,
    FETCHING_JOB_REQUESTS_PROVIDERS,
    FETCHED_JOB_REQUESTS_PROVIDERS,
    FETCHING_JOB_REQUESTS_PROVIDERS_ERROR,
    SET_SELECTED_JOB_REQUEST,
    FETCHED_ALL_JOB_REQUESTS_PRO,
    FETCH_ALL_JOB_REQUESTS_PRO_ERROR,
    FETCHED_ALL_JOB_REQUESTS_CLIENT,
    FETCH_ALL_JOB_REQUESTS_CLIENT_ERROR,
    FETCHED_DATA_WORK_SOURCE,
    FETCH_DATA_WORK_SOURCE_ERROR,
    UPDATE_ACTIVE_REQUREST
} from '../types';

const initialState = {
    selectedJobRequest: null,
    jobRequests: [],
    dataWorkSource: [],
    jobRequestsProviders: [],
    allJobRequestsProviders: [],
    allJobRequestsClient: [],
    requestsProvidersFetched: false,
    allJobRequestsProvidersFetched: false,
    allJobRequestsClientFetched: false,
    fetchingRequestsProviders: false,
    dataWorkSourceFetched: false,
    requestsProvidersError: null,
    requestsFetched: false,
    fetchingRequests: false,
    activeRequest:false,
    requestsError: null
}

const jobsReducer = (state=initialState, action) => {
    switch(action.type){
        case FETCHING_JOB_REQUESTS: 
            return {
                ...state,
                feching: true,
                requestsFetched: false,
                requestsError: null
            }
        case FETCHED_JOB_REQUESTS: 
            return {
                ...state,
                jobRequests: action.payload,
                requestsFetched: true,
                fetchingRequests: false,
                requestsError: null
            }
        case FETCHING_JOB_REQUESTS_ERROR: 
            return {
                ...state,
                requestsError: action.payload,
                requestsFetched: false,
                fetchingRequests: false
            }
        case FETCHING_JOB_REQUESTS_PROVIDERS: 
            return {
                ...state,
                fetchingRequestsProviders: true,
                requestsProvidersFetched: false,
                requestsProvidersError: null
            }
        case FETCHED_JOB_REQUESTS_PROVIDERS: 
            return {
                ...state,
                jobRequestsProviders: action.payload,
                requestsProvidersFetched: true,
                fetchingRequestsProviders: false,
                requestsProvidersError: null
            }
        case FETCHING_JOB_REQUESTS_PROVIDERS_ERROR: 
            return {
                ...state,
                requestsProvidersError: action.payload,
                requestsProvidersFetched: false,
                fetchingRequestsProviders: false
            }
        case SET_SELECTED_JOB_REQUEST: 
            return {
                ...state,
                selectedJobRequest: action.payload
            }
        case FETCHED_ALL_JOB_REQUESTS_PRO:
            return {
                ...state,
                allJobRequestsProviders: action.payload,
                allJobRequestsProvidersFetched: true
            }
        case FETCH_ALL_JOB_REQUESTS_PRO_ERROR:
            return {
                ...state,
                allJobRequestsProvidersFetched: false
            }
        case FETCHED_ALL_JOB_REQUESTS_CLIENT:
            return {
                ...state,
                allJobRequestsClient: action.payload,
                allJobRequestsClientFetched: true
            }
        case FETCH_ALL_JOB_REQUESTS_CLIENT_ERROR:
            return {
                ...state,
                allJobRequestsClientFetched: false
            }
        case FETCHED_DATA_WORK_SOURCE:
            return {
                ...state,
                dataWorkSource: action.payload,
                dataWorkSourceFetched: true
            }
        case FETCH_DATA_WORK_SOURCE_ERROR:
            return {
                ...state,
                dataWorkSourceFetched: false
            }
        case UPDATE_ACTIVE_REQUREST:
            return {
                ...state,
                activeRequest: action.payload
            }
        default: 
            return {
                ...state
            }
    }
}

export default jobsReducer;