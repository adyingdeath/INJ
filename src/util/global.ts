export function isnull(obj: any): boolean {
    return obj === null || obj === undefined;
}

export function notnull(obj: any): boolean {
    return obj !== null && obj !== undefined;
}

export function isUnspecified(obj: any): boolean {
    return obj === null || obj === undefined || obj.trim() === "";
}

export function notUnspecified(obj: any): boolean {
    return obj !== null && obj !== undefined && obj.trim() != "";
}
