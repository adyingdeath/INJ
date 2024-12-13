const characters = '0123456789abcdefghijklmnopqrstuvwxyz';
const generatedIds = new Set();
function generateRandomId(length) {
    let result = '';
    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        result += characters[randomIndex];
    }
    return result;
}
function randomCode(length) {
    let id;
    do {
        id = generateRandomId(length);
    } while (generatedIds.has(id));
    generatedIds.add(id);
    return id;
}
export default randomCode;
//# sourceMappingURL=randomCode.js.map