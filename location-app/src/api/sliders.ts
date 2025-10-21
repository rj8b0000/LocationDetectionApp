export const fetchSliders = async () => {
    try {
        const response = await fetch('/api/slider');
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching sliders:', error);
        throw error;
    }
};