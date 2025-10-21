export const fetchCoordinates = async () => {
    try {
        const response = await fetch('/api/coordinates');
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const data = await response.json();
        return data.coordinates;
    } catch (error) {
        console.error('Error fetching coordinates:', error);
        throw error;
    }
};