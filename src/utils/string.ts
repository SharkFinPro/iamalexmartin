export function camelCaseToSentence(str : string) {
  return str
    // Insert space before uppercase letters (but not at the start)
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    // Insert space before numbers that follow letters
    .replace(/([a-zA-Z])(\d)/g, '$1 $2')
    // Insert space before letters that follow numbers
    .replace(/(\d)([a-zA-Z])/g, '$1 $2')
    // Capitalize the first letter
    .replace(/^./, match => match.toUpperCase());
}