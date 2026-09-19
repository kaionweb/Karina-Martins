export function apiErrorBody(code: string, message: string) {
  return {
    error: {
      code,
      message,
      timestamp: new Date().toISOString(),
      requestId: "",
    },
  };
}
