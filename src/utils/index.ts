export * from "./web3"
export * from "./requests"

export function deepCopy<Type>(obj: Type): Type {
    return JSON.parse(JSON.stringify(obj))
}

export function getUniqueItems(arr: any[]): any[] {
    return arr.filter((value, index, array) => array.indexOf(value) === index);
}