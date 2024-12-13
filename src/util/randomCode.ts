const characters: string = '0123456789abcdefghijklmnopqrstuvwxyz';
const generatedIds = new Set(); // Used to store generated IDs

function generateRandomId(length: number): string {
    let result: string = '';
    for (let i: number = 0; i < length; i++) {
        const randomIndex: number = Math.floor(Math.random() * characters.length);
        result += characters[randomIndex];
    }
    return result;
}

/**
 * Generate a random string of specified length
 * @param {number} length - The length of the generated string
 * @returns {string} - The generated random string
 */
function randomCode(length: number) {
    let id;
    do {
        id = generateRandomId(length); // Assume this is the function to generate random ID
    } while (generatedIds.has(id)); // Check if the ID already exists

    generatedIds.add(id); // Add the newly generated ID to the set
    return id; // Return the unique ID
}

export default randomCode; 