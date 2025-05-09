// script.js (Updated with Raw Packet View)
let isSimulating = false;
let currentStep = 0;
let animationSpeed = 1;
let steps = [];
let isStepRunning = false;
let currentData = ''; // Store the initial data for the raw view

// DOM Elements
const inputData = document.getElementById('input-data');
const startBtn = document.getElementById('start-btn');
const resetBtn = document.getElementById('reset-btn');
const nextBtn = document.getElementById('next-btn');
// prevBtn was removed from HTML, no need for it here
const infoPanel = document.getElementById('info-panel');
const networkPacket = document.getElementById('network-packet');
const wire = document.querySelector('.wire');

// Add new element for raw packet display
const senderRawPacketDisplay = document.getElementById('sender-raw-packet-display');

const senderAppData = document.getElementById('sender-app-data');
const senderTransportData = document.getElementById('sender-transport-data');
const senderInternetData = document.getElementById('sender-internet-data');
const senderLinkData = document.getElementById('sender-link-data');

const receiverLinkData = document.getElementById('receiver-link-data');
const receiverInternetData = document.getElementById('receiver-internet-data');
const receiverTransportData = document.getElementById('receiver-transport-data');
const receiverAppData = document.getElementById('receiver-app-data');

// Delay function
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

// Update info panel
function updateInfo(message) {
    infoPanel.textContent = message;
}

// Update raw packet display
function updateRawPacketView(content) {
    senderRawPacketDisplay.textContent = content;
}

// Highlight layer
function highlightLayer(layerId, isActive) {
    const el = document.getElementById(layerId);
    if (el) {
        if (isActive) el.classList.add('active');
        else el.classList.remove('active');
    }
}

// Display packet components (remains the same)
function displayPacket(element, components, payload = '') {
    if (!element) return;
    element.innerHTML = '';
    components.forEach(comp => {
        const div = document.createElement('div');
        if (comp.includes('header') || comp.includes('trailer')) {
             div.classList.add('header');
             div.classList.add(comp);
             div.textContent = comp.replace('-', ' ').replace('header', 'Hdr').replace('trailer', 'Trl').toUpperCase();
        } else {
             div.classList.add(comp);
             div.textContent = comp.toUpperCase();
        }
        element.appendChild(div);
    });
    if (payload) {
        const payloadDiv = document.createElement('div');
        payloadDiv.classList.add('data-payload');
        payloadDiv.textContent = payload;
        element.appendChild(payloadDiv);
    }
}

// Reset simulation
function resetSimulation() {
    isSimulating = false;
    currentStep = 0;
    isStepRunning = false;
    currentData = ''; // Clear stored data
    updateInfo('Ready. Enter data and click Start.');
    updateRawPacketView('Packet structure will appear here.'); // Reset raw view text

    document.querySelectorAll('.data-unit').forEach(e => e.innerHTML = '');
    document.querySelectorAll('.layer').forEach(e => e.classList.remove('active'));

    // Reset network packet
    networkPacket.innerHTML = '';
    networkPacket.style.opacity = '0';
    networkPacket.classList.remove('transmitting');
    networkPacket.style.left = '2%'; // Reset start position

    wire.style.opacity = '0';

    startBtn.disabled = false;
    resetBtn.disabled = true;
    nextBtn.disabled = true;
    inputData.disabled = false;
}

// Define simulation steps
function setupSteps(initialData) {
    currentData = initialData; // Store the initial data

    steps = [
        // Step 1: Sender App
        async () => {
            highlightLayer('sender-app', true);
            updateInfo('1. Application Layer: Creating data.');
            displayPacket(senderAppData, [], currentData);
            updateRawPacketView(`Application Data:\n"${currentData}"`); // Show data
            await delay(1000);
        },
        // Step 2: Sender Transport
        async () => {
            highlightLayer('sender-app', false);
            highlightLayer('sender-transport', true);
            updateInfo('2. Transport Layer: Adding TCP Header (Segment).');
            displayPacket(senderTransportData, ['tcp-header'], currentData);
            updateRawPacketView(`TCP Header\nPayload:\n  Application Data: "${currentData}"`); // Show TCP + Data
            await delay(1000);
        },
        // Step 3: Sender Internet
        async () => {
            highlightLayer('sender-transport', false);
            highlightLayer('sender-internet', true);
            updateInfo('3. Internet Layer: Adding IP Header (Packet).');
            displayPacket(senderInternetData, ['ip-header', 'tcp-header'], currentData);
            updateRawPacketView(`IP Header\nPayload:\n  TCP Header\n  Payload:\n    Application Data: "${currentData}"`); // Show IP + TCP + Data
            await delay(1000);
        },
        // Step 4: Sender Link
        async () => {
            highlightLayer('sender-internet', false);
            highlightLayer('sender-link', true);
            updateInfo('4. Link Layer: Adding Ethernet Header & Trailer (Frame).');
            displayPacket(senderLinkData, ['eth-header', 'ip-header', 'tcp-header', 'eth-trailer'], currentData);
             updateRawPacketView(`Ethernet Header\nPayload:\n  IP Header\n  Payload:\n    TCP Header\n    Payload:\n      Application Data: "${currentData}"\nEthernet Trailer`); // Show full frame
            await delay(1000);
        },
        // Step 5: Transmission
        async () => {
            highlightLayer('sender-link', false);
            updateInfo('5. Transmission: Sending frame across network.');

            // Prepare packet for animation
            displayPacket(networkPacket, ['eth-header', 'ip-header', 'tcp-header', 'eth-trailer'], currentData);
            networkPacket.style.left = '2%'; // Start position (matches wire start)
            networkPacket.style.opacity = '1'; // Make visible
            wire.style.opacity = '1'; // Make wire visible

            updateRawPacketView(`Transmitting Frame:\nEthernet Header\nIP Header\nTCP Header\nPayload: Application Data: "${currentData}"\nEthernet Trailer`); // Update raw view for transmission

            // Wait for a brief moment to ensure DOM update and initial position is set
            await delay(50);

            // Trigger the transition by changing the 'left' property
            const waitForTransition = new Promise((resolve) => {
                const transitionEnded = (event) => {
                    if (event.propertyName === 'left' && event.target === networkPacket) {
                        console.log("Transition ended naturally.");
                        networkPacket.removeEventListener('transitionend', transitionEnded);
                        resolve();
                    }
                };
                networkPacket.addEventListener('transitionend', transitionEnded);
                setTimeout(() => {
                    networkPacket.removeEventListener('transitionend', transitionEnded);
                    console.log("Transition timeout reached.");
                    resolve();
                }, 2500); // 2000ms transition + 500ms buffer
            });

            console.log("Applying transmitting class and changing left...");
            networkPacket.style.left = '68%'; // End position (matches wire end)

            console.log("Waiting for transition to end...");
            await waitForTransition;
            console.log("Transition finished or timed out.");

            // Keep packet/wire visible until receiver link step
            updateInfo('5. Transmission: Frame sent. Click Next Step for receiving.');
            updateRawPacketView(`Frame Arrived at Receiver:\nEthernet Header\nIP Header\nTCP Header\nPayload: Application Data: "${currentData}"\nEthernet Trailer`); // Update raw view for arrival
        },
        // Step 6: Receiver Link
        async () => {
             // Hide packet and wire from previous step
            networkPacket.style.opacity = '0';
            networkPacket.style.left = '2%'; // Reset position for next sim
            wire.style.opacity = '0';
            await delay(100);

            highlightLayer('receiver-link', true);
            updateInfo('6. Link Layer: Frame received.');
            displayPacket(receiverLinkData, ['eth-header', 'ip-header', 'tcp-header', 'eth-trailer'], currentData);
            updateRawPacketView(`Link Layer (Receiver): Frame received.\nEthernet Header\nIP Header\nTCP Header\nPayload: Application Data: "${currentData}"\nEthernet Trailer`); // Receiver view

            await delay(1500);

            updateInfo('6. Link Layer: Removing Ethernet Header & Trailer.');
            displayPacket(receiverLinkData, ['ip-header', 'tcp-header'], currentData);
             updateRawPacketView(`Link Layer (Receiver): Removing Headers...\n\n  IP Header\n  TCP Header\n  Payload: Application Data: "${currentData}"`); // Headers removed
            await delay(1000);
        },
        // Step 7: Receiver Internet
        async () => {
            highlightLayer('receiver-link', false);
            highlightLayer('receiver-internet', true);
            updateInfo('7. Internet Layer: Packet received.');
            displayPacket(receiverInternetData, ['ip-header', 'tcp-header'], currentData);
            updateRawPacketView(`Internet Layer (Receiver): Packet received.\n\nIP Header\nTCP Header\nPayload: Application Data: "${currentData}"`); // Receiver view

            await delay(1500);

            updateInfo('7. Internet Layer: Removing IP Header.');
            displayPacket(receiverInternetData, ['tcp-header'], currentData);
             updateRawPacketView(`Internet Layer (Receiver): Removing IP Header...\n\n\n  TCP Header\n  Payload: Application Data: "${currentData}"`); // Header removed
            await delay(1000);
        },
        // Step 8: Receiver Transport
        async () => {
            highlightLayer('receiver-internet', false);
            highlightLayer('receiver-transport', true);
            updateInfo('8. Transport Layer: Segment received.');
            displayPacket(receiverTransportData, ['tcp-header'], currentData);
             updateRawPacketView(`Transport Layer (Receiver): Segment received.\n\n\nTCP Header\nPayload: Application Data: "${currentData}"`); // Receiver view

            await delay(1500);

            updateInfo('8. Transport Layer: Removing TCP Header.');
            displayPacket(receiverTransportData, [], currentData);
            updateRawPacketView(`Transport Layer (Receiver): Removing TCP Header...\n\n\n\nApplication Data: "${currentData}"`); // Header removed
            await delay(1000);
        },
        // Step 9: Receiver App
        async () => {
            highlightLayer('receiver-transport', false);
            highlightLayer('receiver-app', true);
            updateInfo('9. Application Layer: Data delivered.');
            displayPacket(receiverAppData, [], currentData);
            updateRawPacketView(`Application Layer (Receiver): Data delivered!\n\n\n\nApplication Data: "${currentData}"`); // Data delivered
            await delay(1500);
        },
        // Step 10: Completion
        async () => {
            highlightLayer('receiver-app', false);
            updateInfo('Simulation Complete.');
             updateRawPacketView(`Simulation Complete.\nApplication Data: "${currentData}" received.`); // Final state
            nextBtn.disabled = true;
            resetBtn.disabled = false;
        }
    ];
}

// --- Event Listeners ---
startBtn.addEventListener('click', () => {
    const data = inputData.value.trim();
    if (!data) {
        updateInfo('Please enter data before starting.');
        return;
    }
    resetSimulation(); // Ensure clean state
    isSimulating = true;
    startBtn.disabled = true;
    resetBtn.disabled = false;
    nextBtn.disabled = false;
    inputData.disabled = true;
    setupSteps(data);
    currentStep = 0;
    updateInfo('Simulation started. Click Next Step to proceed.');
});

// Full Reset button
resetBtn.addEventListener('click', resetSimulation);


nextBtn.addEventListener('click', async () => {
    // Prevent multiple clicks from triggering steps simultaneously
    if (!isSimulating || currentStep >= steps.length || isStepRunning) {
        console.log(`Next click ignored: isSimulating=${isSimulating}, currentStep=${currentStep}, steps.length=${steps.length}, isStepRunning=${isStepRunning}`);
        return;
    }

    // Disable buttons while a step is running
    nextBtn.disabled = true;
    resetBtn.disabled = true; // Also disable full reset
    isStepRunning = true;
    console.log(`Executing step ${currentStep + 1}`);

    try {
        // Execute the current step function
        await steps[currentStep]();

        // Move to the next step only after the current one completes
        currentStep++;

        // Check if simulation is finished
        if (currentStep >= steps.length) {
            updateInfo('Simulation Complete.');
            isSimulating = false;
            resetBtn.disabled = false; // Enable full reset
            nextBtn.disabled = true; // Disable Nex
        }

    } catch (error) {
        console.error(`Error in step ${currentStep + 1}:`, error);
        updateInfo(`Error during step ${currentStep + 1}. Check console (F12).`);
        isSimulating = false;
        resetBtn.disabled = false; 
        nextBtn.disabled = true; 
    } finally {
        isStepRunning = false;
        if (isSimulating && currentStep < steps.length) {
             nextBtn.disabled = false;
             resetBtn.disabled = false; 
        }
    }
});

resetSimulation();