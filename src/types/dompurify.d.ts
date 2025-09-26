declare module 'dompurify' {
  const DOMPurify: {
    sanitize: (dirty: string, config?: any) => string;
  };
  export default DOMPurify;
}
