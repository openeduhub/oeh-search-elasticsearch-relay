export const SEPARATOR =
    '-----------------------------------------------------------------------\n';

export function logError(...params: any[]) {
    console.error(new Date().toUTCString(), 'ERROR:', ...params);
}

export function logInfo(...params: any[]) {
    console.log(new Date().toUTCString(), 'INFO:', ...params);
}
