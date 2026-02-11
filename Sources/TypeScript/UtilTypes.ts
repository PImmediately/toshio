// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Instantiable<T = any> = { new(...args: any[]): T };