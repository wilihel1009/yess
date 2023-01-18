export const addString = function (str: string, position: number, content: string): string {
  return str.substring(0, position) + content + str.substring(position)
}

export const deleteString = function (str: string, position: number, deleteLength: number): string {
  return str.substring(0, position) + str.substring(position + deleteLength)
}
