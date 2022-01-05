const CREDIT_CARD_MM = 53.975;
const PARAM_APPLY_DELAY_MS = 1000;

var testingArea = document.getElementById('testing_area').getContext('2d');
testingArea.previousTouch = null;
var testingArguments = {
    size: Math.round(Math.min(screen.width, screen.height) * window.devicePixelRatio / 2),
    gap: 0
};
var params = {
    pixelSize: document.getElementById('pixel_size'),
    gapSize: document.getElementById('gap_size'),
    axis: document.getElementById('axis'),
    viewingDistance: document.getElementById('viewing_distance'),
    vertexDistance: document.getElementById('vertex_distance')
};
params.pixelSize.delayTimeout = undefined;
params.pixelSize.value = 250;
params.gapSize.value = 3;
params.axis.value = 90;
params.viewingDistance.value = 30;
params.vertexDistance.value = 1.5;
params.getValue = function(element) {
    const parsedValue = Number(this[element].value);
    const isInvalid = Number.isNaN(parsedValue) || Math.abs(parsedValue) === Infinity || parsedValue <= 0;
    return {
        isValid: !isInvalid,
        value: isInvalid ? 0 : parsedValue
    };
};
var outputs = {
    power: document.getElementById('power')
};

function calculatePower() {
    const pixelSize = params.getValue('pixelSize').value / 1000000.0;
    const gapRadius = params.getValue('gapSize').value / 1000.0 / 2.0;
    const gapDelta = gapRadius - testingArguments.gap / 2.0 * pixelSize;
    const viewingDistance = params.getValue('viewingDistance').value / 100.0;
    const vertexDistance = params.getValue('vertexDistance').value / 100.0;
    const power = 1.0 / (gapRadius * viewingDistance / gapDelta + vertexDistance);
    outputs.power.value = power.toFixed(3);
}

function initCanvas(canvas, args) {
    canvas.width = canvas.height = args.size;
    canvas.style.width = canvas.style.height = args.size + 'px';
}

function drawTestingArea(ctx, args) {
    const width = ctx.canvas.width, height = ctx.canvas.height;
    //Background
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, width, height);
    //Apply axis
    const angle = 90.0 - params.getValue('axis').value;
    ctx.imageSmoothingEnabled = angle > -270;
    ctx.save();
    ctx.translate(width / 2, height / 2);
    ctx.rotate(Math.PI * angle / 180.0);
    ctx.translate(-width / 2, -height / 2);
    //Green line (static)
    const baseline = Math.floor(height / 2);
    ctx.fillStyle = '#00FF00';
    ctx.fillRect(-width, baseline, width * 3, 1);
    //Red line (moving)
    ctx.fillStyle = '#FF0000';
    ctx.fillRect(-width, baseline - args.gap, width * 3, 1);
    //Stats
    ctx.restore();
    const pixelSize = params.getValue('pixelSize').value / 1000;
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '0.5em sans-serif';
    ctx.fillText(args.gap + 'px ≙ ' + (args.gap * pixelSize).toFixed(3) + 'mm', 3, args.size - 4);
}

function moveLine(delta) {
    const limit = Math.floor(testingArguments.size / 2)
    testingArguments.gap = Math.min(Math.max(-limit, testingArguments.gap + delta), limit);
    drawTestingArea(testingArea, testingArguments);
    calculatePower();
}

function setSiteScrollable(scrollable) {
    if (scrollable) {
        document.body.classList.remove('no-scroll');
    } else {
        document.body.classList.add('no-scroll');
    }
}

function applyParamChange() {
    const pixelSize = params.getValue('pixelSize');
    const gapSize = params.getValue('gapSize');
    if (!pixelSize.isValid) {
        return;
    }
    testingArguments.size = Math.round(CREDIT_CARD_MM / (pixelSize.value / 1000));
    testingArguments.gap = Math.round(gapSize.value / (pixelSize.value / 1000));
    initCanvas(testingArea.canvas, testingArguments);
    drawTestingArea(testingArea, testingArguments);
    calculatePower();
}

function onChangePixelSize(delta) {
    if (typeof delta !== 'undefined') { //Immediately visualize changes when using + and - buttons
        const pixelSize = params.getValue('pixelSize');
        if (pixelSize.isValid) {
            params.pixelSize.value = pixelSize.value + delta;
            applyParamChange();
        }
    } else { //Only apply changes 1 second after having finished typing
        clearTimeout(params.pixelSize.delayTimeout);
        params.pixelSize.delayTimeout = setTimeout(applyParamChange, PARAM_APPLY_DELAY_MS);
    }
}

testingArea.canvas.addEventListener('wheel', event => {
    moveLine(Math.sign(event.wheelDeltaY));
});
testingArea.canvas.addEventListener('click', event => {
    const relativePosY = event.pageY - testingArea.canvas.offsetTop;
    moveLine(Math.sign(testingArguments.size / 2 - relativePosY));
});
testingArea.canvas.addEventListener('touchstart', event => {
    testingArea.previousTouch = event.touches[0];
});
testingArea.canvas.addEventListener('touchmove', event => {
    const delta = testingArea.previousTouch.pageY - event.touches[0].pageY;
    moveLine(delta);
    testingArea.previousTouch = event.touches[0];
});
applyParamChange();