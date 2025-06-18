export function isValidUserData(data) {
  return (
    data &&
    typeof data === 'object' &&
    data !== null &&
    'id' in data &&
    data.id != null
  )
}
