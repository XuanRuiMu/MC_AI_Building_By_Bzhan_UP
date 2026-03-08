const CustomInspect = Symbol.for("nodejs.util.inspect.custom");
export class Int8 extends Number {
    constructor(value) {
        super(value << 24 >> 24);
    }
    valueOf() {
        return super.valueOf();
    }
    get [Symbol.toStringTag]() {
        return "Int8";
    }
    /**
     * @internal
    */
    get [CustomInspect]() {
        return (_, { stylize }) => stylize(`${this.valueOf()}b`, "number");
    }
}
export class Int16 extends Number {
    constructor(value) {
        super(value << 16 >> 16);
    }
    valueOf() {
        return super.valueOf();
    }
    get [Symbol.toStringTag]() {
        return "Int16";
    }
    /**
     * @internal
    */
    get [CustomInspect]() {
        return (_, { stylize }) => stylize(`${this.valueOf()}s`, "number");
    }
}
export class Int32 extends Number {
    constructor(value) {
        super(value | 0);
    }
    valueOf() {
        return super.valueOf();
    }
    get [Symbol.toStringTag]() {
        return "Int32";
    }
    /**
     * @internal
    */
    get [CustomInspect]() {
        return () => this.valueOf();
    }
}
export class Float32 extends Number {
    constructor(value) {
        super(value);
    }
    valueOf() {
        return super.valueOf();
    }
    get [Symbol.toStringTag]() {
        return "Float32";
    }
    /**
     * @internal
    */
    get [CustomInspect]() {
        return (_, { stylize }) => stylize(`${this.valueOf()}f`, "number");
    }
}
//# sourceMappingURL=primitive.js.map