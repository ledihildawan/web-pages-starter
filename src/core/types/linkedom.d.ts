declare module 'linkedom' {
  export class DOMParser {
    parseFromString(source: string, mimeType: string): Document;
  }
}
