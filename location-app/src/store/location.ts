export interface LocationState {
    isInsidePolygon: boolean;
    userLocation: {
        latitude: number;
        longitude: number;
    } | null;
}

const initialState: LocationState = {
    isInsidePolygon: false,
    userLocation: null,
};

export const locationReducer = (state = initialState, action: any): LocationState => {
    switch (action.type) {
        case 'SET_USER_LOCATION':
            return {
                ...state,
                userLocation: action.payload,
            };
        case 'SET_INSIDE_POLYGON':
            return {
                ...state,
                isInsidePolygon: action.payload,
            };
        default:
            return state;
    }
};

export const setUserLocation = (location: { latitude: number; longitude: number }) => ({
    type: 'SET_USER_LOCATION',
    payload: location,
});

export const setInsidePolygon = (isInside: boolean) => ({
    type: 'SET_INSIDE_POLYGON',
    payload: isInside,
});