class Sub {
    /**
     * @param {Number} element
     */
    constructor(element) {
        this.sum = element;
        this.array = [element];
        this.updateType();
    }

    updateType() {
        this.type = this.sum >= 0 ? '+' : '-';
    }

    /**
     * @param {Sub} other
     */
    merge(other) {
        this.sum += other.sum;
        this.array = this.array.concat(other.array);
        this.updateType();
    }

    isSame(other) {
        return this.type === other.type
            || this.sum === 0 || other.sum === 0;
    }
}

export function getSub(){
    return Sub;
}