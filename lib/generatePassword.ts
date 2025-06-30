export const generatePassword = (length = 12): string => {
  const charSet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()';
  return Array.from(
    { length },
    () => charSet[Math.floor(Math.random() * charSet.length)]
  ).join('');
};