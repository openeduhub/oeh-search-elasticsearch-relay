import { Readable } from 'stream';

export function bufferToReadable(buffer: Buffer): Readable {
    const readable = new Readable();
    readable._read = () => {};
    readable.push(buffer);
    readable.push(null);
    return readable;
}
