declare module 'dompurify' {
  const DOMPurify: {
    sanitize: (dirty: string, config?: any) => string;
    addHook: (hookName: string, hookFunction: (node: Element) => void) => void;
  };
  export default DOMPurify;
}
