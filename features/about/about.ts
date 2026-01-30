export default function aboutController() {
  return {
    version: '1.0.0',
    author: 'Your Name',

    showInfo(): void {
      alert(`Version: ${this.version}\nAuthor: ${this.author}`);
    }
  };
}
