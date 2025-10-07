class Registers {
    constructor() {
        this.AC = 0; 
        this.PC = 0; 
        this.IR = ""; 
        this.MAR = 0; 
        this.MDR = 0; 
    }

    reset() {
        this.AC = 0;
        this.PC = 0;
        this.IR = "";
        this.MAR = 0;
        this.MDR = 0;
    }

    toString() {
        return `AC=${this.AC}, PC=${this.PC}, IR=${this.IR}, MAR=${this.MAR}, MDR=${this.MDR}`;
    }
}

class Memory {
    constructor(size = 256) {
        this.size = size;
        this.data = new Array(size).fill(0);
        this.instructions = new Array(size).fill("");
        this.isInstruction = new Array(size).fill(false);
    }

    clear() {
        this.data.fill(0);
        this.instructions.fill("");
        this.isInstruction.fill(false);
    }

    setInstruction(address, instruction) {
        if (address >= 0 && address < this.size) {
            this.instructions[address] = instruction;
            this.isInstruction[address] = true;
        }
    }

    setData(address, value) {
        if (address >= 0 && address < this.size) {
            this.data[address] = value;
        }
    }

    getValue(address) {
        if (address >= 0 && address < this.size) {
            return this.data[address];
        }
        return 0;
    }

    getInstruction(address) {
        if (address >= 0 && address < this.size) {
            return this.instructions[address];
        }
        return "";
    }
}

class CPU {
    constructor() {
        this.registers = new Registers();
        this.memory = new Memory();
        this.halted = false;
        this.executionLog = [];
    }

    reset() {
        this.registers.reset();
        this.memory.clear();
        this.halted = false;
        this.executionLog = [];
    }

    fetch() {
        this.registers.MAR = this.registers.PC;
        const instruction = this.memory.getInstruction(this.registers.MAR);
        this.registers.MDR = instruction;
        this.registers.IR = instruction;
        this.registers.PC += 1;
    }

    decodeExecute() {
        if (!this.registers.IR || this.registers.IR.trim() === "" || this.halted) {
            return;
        }

        const instructionParts = this.registers.IR.split(/\s+/);
        const opcode = instructionParts[0].toUpperCase();

        if (opcode === "HLT") {
            this.halted = true;
            this.executionLog.push(`PC=${this.registers.PC - 1} IR=${this.registers.IR} Program Halted.`);
            return;
        }

        if (instructionParts.length < 2) {
            this.executionLog.push(`PC=${this.registers.PC - 1}\tIR=${this.registers.IR}\tError: Missing operand`);
            return;
        }

        const [validAddr, address] = Validator.validateAddress(instructionParts[1]);
        if (!validAddr) {
            this.executionLog.push(`PC=${this.registers.PC - 1}\tIR=${this.registers.IR}\tError: Invalid address: ${address}`);
            return;
        }

        const currentAc = this.registers.AC;
        const memoryValue = this.memory.getValue(address);

        switch (opcode) {
            case "LOAD":
                this.registers.AC = memoryValue;
                this.executionLog.push(`PC=${this.registers.PC - 1} IR=${this.registers.IR} AC=${this.registers.AC}`);
                break;
            case "STORE":
                this.memory.setData(address, this.registers.AC);
                this.executionLog.push(`PC=${this.registers.PC - 1} IR=${this.registers.IR} Memory[${address}]=${this.registers.AC}`);
                break;
            case "ADD":
                this.registers.AC += memoryValue;
                this.executionLog.push(`PC=${this.registers.PC - 1} IR=${this.registers.IR} AC=${this.registers.AC}`);
                break;
            case "SUB":
                this.registers.AC -= memoryValue;
                this.executionLog.push(`PC=${this.registers.PC - 1} IR=${this.registers.IR} AC=${this.registers.AC}`);
                break;
            default:
                this.executionLog.push(`PC=${this.registers.PC - 1} IR=${this.registers.IR} Error: Unknown instruction`);
        }
    }

    runCycle() {
        if (this.halted || this.registers.PC >= this.memory.size) {
            return false;
        }
        this.fetch();
        this.decodeExecute();
        return !this.halted;
    }

    runProgram() {
        while (this.runCycle()) {
        }
        return this.executionLog;
    }

    loadProgram(instructions, dataValues) {
        for (const address in instructions) {
            this.memory.setInstruction(parseInt(address, 10), instructions[address]);
        }

        for (const address in dataValues) {
            this.memory.setData(parseInt(address, 10), dataValues[address]);
        }
    }
}