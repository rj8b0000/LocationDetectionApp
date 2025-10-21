export interface User {
    id: string;
    name: string;
    mobile: string;
    token: string;
}

export interface Coordinates {
    latitude: number;
    longitude: number;
}

export interface Polygon {
    id: string;
    coordinates: Coordinates[];
}

export interface Slider {
    id: string;
    imageUrl: string;
    link: string;
}

export interface Feedback {
    userId: string;
    message: string;
}

export interface ActivitySetting {
    id: string;
    isEnabled: boolean;
}