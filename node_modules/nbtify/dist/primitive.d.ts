export declare class Int8<T extends number = number> extends Number {
    constructor(value: T);
    valueOf(): T;
    get [Symbol.toStringTag](): "Int8";
}
export declare class Int16<T extends number = number> extends Number {
    constructor(value: T);
    valueOf(): T;
    get [Symbol.toStringTag](): "Int16";
}
export declare class Int32<T extends number = number> extends Number {
    constructor(value: T);
    valueOf(): T;
    get [Symbol.toStringTag](): "Int32";
}
export declare class Float32<T extends number = number> extends Number {
    constructor(value: T);
    valueOf(): T;
    get [Symbol.toStringTag](): "Float32";
}
