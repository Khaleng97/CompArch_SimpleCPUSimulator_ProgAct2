class Validator {
    static validateAddress(address, maxMemory = 256) {
        try {
            const addr = parseInt(address, 10);
            if (isNaN(addr) || addr < 0 || addr >= maxMemory) {
                return [false, `Address must be between 0 and ${maxMemory - 1}`];
            }
            return [true, addr];
        } catch (e) {
            return [false, "Address must be a valid integer"];
        }
    }

    static validateDataValue(value) {
        try {
            const val = parseInt(value, 10);
            if (isNaN(val)) {
                return [false, "Data value must be a valid integer"];
            }
            return [true, val];
        } catch (e) {
            return [false, "Data value must be a valid integer"];
        }
    }

    static checkDuplicateInstructions(instructions) {
        const usedAddresses = new Set();
        const duplicates = [];

        for (const addr in instructions) {
            if (instructions[addr] && usedAddresses.has(parseInt(addr, 10))) {
                duplicates.push(parseInt(addr, 10));
            } else if (instructions[addr]) {
                usedAddresses.add(parseInt(addr, 10));
            }
        }
        return [duplicates.length === 0, duplicates];
    }
}