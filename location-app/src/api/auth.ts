export const loginUser = async (mobile: string, password: string) => {
    const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ mobile, password }),
    });
    if (!response.ok) {
        throw new Error('Login failed');
    }
    return await response.json();
};

export const logoutUser = async () => {
    // Logic for logging out the user
    // This could involve clearing tokens or user data from storage
};