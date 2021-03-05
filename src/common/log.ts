export function logError(...params: any[]) {
    console.error(new Date().toUTCString(), ...params);
}

export function logInfo(...params: any[]) {
    console.log(new Date().toUTCString(), ...params);
}
