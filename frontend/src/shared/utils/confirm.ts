type ConfirmFn = (message?: string) => boolean;

export const confirmAction = (message: string, confirmFn?: ConfirmFn) => {
  const ask = confirmFn || ((text?: string) => window.confirm(text));
  return ask(message);
};
