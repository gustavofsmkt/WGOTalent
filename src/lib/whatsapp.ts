export function getWhatsAppUrl(celular: string | null | undefined): string {
  if (!celular) return "";
  
  const numbersOnly = celular.replace(/\D/g, "");
  if (!numbersOnly) return "";
  
  let formattedNumber = numbersOnly;
  if (numbersOnly.length >= 12 && numbersOnly.length <= 13 && numbersOnly.startsWith("55")) {
    formattedNumber = numbersOnly;
  } else if (!numbersOnly.startsWith("55") || numbersOnly.length < 12) {
    // If it starts with 55 but length is < 12, it could be a local number in area code 55 (e.g. 55 98765-4321)
    // Wait, area code 55 is RS. (55) 98765-4321 -> 55987654321 (11 digits).
    // So if it's 11 digits and starts with 55, it's NOT the country code, it's the area code.
    // So we prefix 55. This logic is covered by the `length >= 12 && ...` check.
    formattedNumber = `55${numbersOnly}`;
  }
  
  return `https://wa.me/${formattedNumber}`;
}
