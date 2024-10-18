export function arrayToKeyedObject(arr: (string)[]): { [key: string]: string } {
  const result: { [key: string]: string } = {};
  for (let i = 0; i < arr.length; i += 2) {
    const key = arr[i] as string;
    const value = arr[i + 1] as string;
    result[key] = value;
  }
  return result;
}
