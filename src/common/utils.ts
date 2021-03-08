// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function assertUnreachable(x: never): never {
    throw new Error('Did not expect to get here');
}

export type Unpacked<T> = T extends (infer U)[] ? U : T;

const knownWarnings: string[] = [];

export function warn(message: string) {
    if (knownWarnings.includes(message)) {
        return;
    }
    knownWarnings.push(message);
    console.warn(message);
}
