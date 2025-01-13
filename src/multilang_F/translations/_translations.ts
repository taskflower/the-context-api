export function _t(
  defaultText: string,
  translations: Record<string, Record<string, string>>,
  variables: Record<string, any> = {}
): string {
  const language = "pl"; 
  const textTranslations = translations[defaultText];
  const translatedText = textTranslations?.[language] || defaultText;
  return Object.entries(variables).reduce(
    (text, [key, value]) => text.replace(new RegExp(`\\$\\{${key}\\}`, "g"), value),
    translatedText
  );
}
