class UIController {
    constructor() {
        this.cpu = null;
        this.instructionAddresses = [];
        this.dataAddresses = new Set();
        this.dataInputs = {};
        
        this.instructionCountInput = document.getElementById("instruction-count");
        this.setupBtn = document.getElementById("setup-btn");
        this.instructionsTableBody = document.querySelector("#instructions-table tbody");
        this.dataGroup = document.getElementById("data-group");
        this.dataTitle = document.getElementById("data-title");
        this.dataInputsContainer = document.getElementById("data-inputs-container");
        this.runBtn = document.getElementById("run-btn");
        this.resetBtn = document.getElementById("reset-btn");
        this.outputTextarea = document.getElementById("output-text");
        
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        this.setupBtn.addEventListener("click", () => this.setupInstructions());
        this.runBtn.addEventListener("click", () => this.runProgram());
        this.resetBtn.addEventListener("click", () => this.resetProgram());
    }

    setupInstructions() {
        const count = parseInt(this.instructionCountInput.value, 10);
        this.instructionAddresses.length = 0;
        this.dataAddresses.clear();
        this.clearDataInputs();

        this.instructionsTableBody.innerHTML = "";
        for (let i = 0; i < count; i++) {
            const row = this.instructionsTableBody.insertRow();
            
            const addressCell = row.insertCell(0);
            addressCell.textContent = i;
            
            const instructionCell = row.insertCell(1);
            const instrCombo = document.createElement("select");
            ["", "LOAD", "STORE", "ADD", "SUB", "HLT"].forEach(option => {
                const opt = document.createElement("option");
                opt.value = option;
                opt.textContent = option;
                instrCombo.appendChild(opt);
            });
            instrCombo.addEventListener("change", (e) => this.onInstructionChange(i, e.target.value));
            instructionCell.appendChild(instrCombo);
            
            const operandCell = row.insertCell(2);
            const operandInput = document.createElement("input");
            operandInput.type = "text";
            operandInput.placeholder = "Address";
            operandInput.disabled = true;
            operandInput.addEventListener("input", () => this.onOperandChange());
            operandCell.appendChild(operandInput);

            this.instructionAddresses.push(i);
        }

        this.runBtn.disabled = false;
        this.resetBtn.disabled = false;
        
        if (this.instructionsTableBody.rows.length > 0) {
            const hltRow = this.instructionsTableBody.rows[this.instructionsTableBody.rows.length - 1];
            hltRow.cells[1].querySelector("select").value = "HLT";
        }
    }

    onInstructionChange(row, instruction) {
        const operandInput = this.instructionsTableBody.rows[row].cells[2].querySelector("input");
        
        if (["LOAD", "STORE", "ADD", "SUB"].includes(instruction)) {
            operandInput.disabled = false;
            operandInput.placeholder = "Data Address";
        } else {
            operandInput.disabled = true;
            operandInput.value = "";
        }
        this.updateDataInputs();
    }

    onOperandChange() {
        this.updateDataInputs();
    }

    clearDataInputs() {
        this.dataInputsContainer.innerHTML = "";
        for (const key in this.dataInputs) {
            delete this.dataInputs[key];
        }
    }

    updateDataInputs() {
        this.clearDataInputs();
        this.dataAddresses.clear();

        for (let i = 0; i < this.instructionsTableBody.rows.length; i++) {
            const instrCombo = this.instructionsTableBody.rows[i].cells[1].querySelector("select");
            const instruction = instrCombo.value;
            if (["LOAD", "STORE", "ADD", "SUB"].includes(instruction)) {
                const operandInput = this.instructionsTableBody.rows[i].cells[2].querySelector("input");
                const operandText = operandInput.value.trim();
                if (operandText) {
                    const [valid, address] = Validator.validateAddress(operandText);
                    if (valid) {
                        this.dataAddresses.add(address);
                    }
                }
            }
        }

        if (this.dataAddresses.size === 0) {
            this.dataGroup.style.display = "none";
            return;
        }

        this.dataGroup.style.display = "block";
        this.dataTitle.textContent = `Data Values (Addresses: ${[...this.dataAddresses].sort((a, b) => a - b).join(", ")})`;
        
        const storeAddresses = new Set();
        for (let i = 0; i < this.instructionsTableBody.rows.length; i++) {
            const row = this.instructionsTableBody.rows[i];
            const instrCombo = row.cells[1].querySelector("select");
            const operandInput = row.cells[2].querySelector("input");
            
            if (instrCombo.value === "STORE" && operandInput.value) {
                const storeAddress = parseInt(operandInput.value);
                if (!isNaN(storeAddress)) {
                    storeAddresses.add(storeAddress);
                }
            }
        }

        const sortedAddresses = [...this.dataAddresses].sort((a, b) => a - b);
        sortedAddresses.forEach(address => {
            const row = document.createElement("div");
            row.className = "data-input-row";
            const label = document.createElement("label");
            label.textContent = `Address ${address}:`;
            const dataEdit = document.createElement("input");
            dataEdit.type = "text";
            dataEdit.placeholder = "Value";
            dataEdit.value = "0";
            dataEdit.dataset.address = address;
            
            
            if (storeAddresses.has(address)) {
                dataEdit.disabled = true;
                dataEdit.placeholder = "Store Location";
                dataEdit.style.opacity = "0.8";
                dataEdit.style.backgroundColor = "rgba(255, 193, 7, 0.1)"; 
            }
            
            this.dataInputs[address] = dataEdit;
            row.appendChild(label);
            row.appendChild(dataEdit);
            this.dataInputsContainer.appendChild(row);
        });
    }

    getProgramData() {
        const instructions = {};
        const dataAddressesUsed = new Set();
        let hasError = false;

        for (let i = 0; i < this.instructionsTableBody.rows.length; i++) {
            const address = parseInt(this.instructionsTableBody.rows[i].cells[0].textContent, 10);
            const instruction = this.instructionsTableBody.rows[i].cells[1].querySelector("select").value;

            if (instruction) {
                if (["LOAD", "STORE", "ADD", "SUB"].includes(instruction)) {
                    const operandInput = this.instructionsTableBody.rows[i].cells[2].querySelector("input");
                    const operand = operandInput.value.trim();
                    if (!operand) {
                        alert(`Error: Missing operand for instruction at address ${address}`);
                        hasError = true;
                        break;
                    }

                    const [valid, operandVal] = Validator.validateAddress(operand);
                    if (!valid) {
                        alert(`Error: Invalid operand at address ${address}: ${operandVal}`);
                        hasError = true;
                        break;
                    }
                    instructions[address] = `${instruction} ${operandVal}`;
                    dataAddressesUsed.add(operandVal);
                } else {
                    instructions[address] = instruction;
                }
            }
        }

        if (hasError) return [null, null];

        const [validDuplicates, duplicates] = Validator.checkDuplicateInstructions(instructions);
        if (!validDuplicates) {
            alert(`Error: Duplicate instructions at addresses: ${duplicates.join(", ")}`);
            return [null, null];
        }
        
        const dataValues = {};
        dataAddressesUsed.forEach(address => {
            if (this.dataInputs[address]) {
                const value = this.dataInputs[address].value.trim();
                if (value) {
                    const [valid, valueVal] = Validator.validateDataValue(value);
                    if (!valid) {
                        alert(`Error: Invalid data value at address ${address}: ${valueVal}`);
                        hasError = true;
                    }
                    dataValues[address] = valueVal;
                } else {
                    dataValues[address] = 0;
                }
            } else {
                dataValues[address] = 0;
            }
        });

        if (hasError) return [null, null];

        return [instructions, dataValues];
    }

    async runProgram() {
        const [instructions, dataValues] = this.getProgramData();
        if (instructions === null) return;

        this.cpu = new CPU();
        this.cpu.loadProgram(instructions, dataValues);

        this.outputTextarea.value = "";
        this.runBtn.disabled = true;
        this.resetBtn.disabled = false;

        const delay = 1000;

        while (!this.cpu.halted && this.cpu.registers.PC < this.cpu.memory.size) {
            this.cpu.runCycle();
            this.displayLog();
            
            if (!this.cpu.halted) {
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }

        this.displayStoredValues();
        
        this.runBtn.disabled = false;
    }

    displayStoredValues() {
        const storeAddresses = new Set();
        for (let i = 0; i < this.instructionsTableBody.rows.length; i++) {
            const row = this.instructionsTableBody.rows[i];
            const instrCombo = row.cells[1].querySelector("select");
            const operandInput = row.cells[2].querySelector("input");
            
            if (instrCombo.value === "STORE" && operandInput.value) {
                const storeAddress = parseInt(operandInput.value);
                if (!isNaN(storeAddress)) {
                    storeAddresses.add(storeAddress);
                }
            }
        }
        
        for (const address in this.dataInputs) {
            const dataInput = this.dataInputs[address];
            if (this.cpu && dataInput) {
                const actualValue = this.cpu.memory.getValue(parseInt(address));
                dataInput.value = actualValue.toString();
                
                if (storeAddresses.has(parseInt(address))) {
                    dataInput.disabled = true;
                    dataInput.style.opacity = "0.8";
                    dataInput.style.backgroundColor = "rgba(76, 175, 80, 0.1)";
                    dataInput.placeholder = "Stored Result";
                }
            }
        }
    }

    resetProgram() {
        this.cpu = null;
        this.outputTextarea.value = "";
        
        this.instructionAddresses.length = 0;
        this.dataAddresses.clear();
        this.clearDataInputs();
        
        this.dataGroup.style.display = "none";
        
        this.instructionCountInput.value = "4";
        
        this.instructionsTableBody.innerHTML = "";
        
        this.setupInstructions();
    }

    displayLog() {
        this.outputTextarea.value = this.cpu.executionLog.join("\n");
        this.outputTextarea.scrollTop = this.outputTextarea.scrollHeight;
    }
}

document.addEventListener('DOMContentLoaded', function() {
    const uiController = new UIController();
});